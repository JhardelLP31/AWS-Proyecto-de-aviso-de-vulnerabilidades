import { Inject, Injectable } from '@nestjs/common';
import {
  BBox,
  GEOFENCE_RADIUS_M,
  hasPermission,
  haversineMeters,
  IncidentStatus,
  IncidentType,
  isInsideBBox,
  MAX_PHOTOS_PER_INCIDENT,
  PERMISSIONS,
  PIURA_BBOX,
  Severity,
  VoteKind,
} from '@geoalert/contracts';
import { randomUUID } from 'node:crypto';
import { AuditContext } from '../../audit/services/audit-context';
import type { AccessProfile } from '../../rbac/types/identity.types';
import {
  GeofenceViolation,
  IncidentClosed,
  IncidentNotFound,
  InvalidPhoto,
  OutOfCoverageArea,
  SelfVoteNotAllowed,
  StaleVersion,
} from '../domain/errors';
import type { Incident, IncidentPhoto, TriagePatch } from '../types/incident.types';
import { IIncidentEventsPublisher, INCIDENT_EVENTS, IPhotoStorage, PHOTO_STORAGE } from '../domain/ports';
import { IIncidentRepository, INCIDENT_REPOSITORY } from '../repositories/incident.repository';
import { makeRescorer, Rescorer, userWeight, VERACITY_POLICY, VeracityPolicy } from '../domain/veracity';
import { inspectPhoto } from './photo-inspector';

export interface ReportIncidentCommand {
  type: IncidentType;
  severity: Severity;
  title: string;
  description: string;
  lat: number;
  lng: number;
  district?: string;
  occurredAt?: Date;
  photos: Buffer[];
}

export interface CastVoteCommand {
  kind: VoteKind;
  lat: number;
  lng: number;
  /** Precisión reportada por el GPS del dispositivo, en metros. */
  accuracyM: number;
}

export interface TriageCommand extends TriagePatch {
  expectedVersion: number;
}

/** Precisión GPS máxima aceptada para votar: con más error la geocerca de 500 m no significa nada. */
const MAX_GPS_ACCURACY_M = 250;

@Injectable()
export class IncidentsService {
  private readonly rescore: Rescorer;

  constructor(
    @Inject(INCIDENT_REPOSITORY) private readonly incidents: IIncidentRepository,
    @Inject(INCIDENT_EVENTS) private readonly events: IIncidentEventsPublisher,
    @Inject(PHOTO_STORAGE) private readonly photos: IPhotoStorage,
    @Inject(VERACITY_POLICY) private readonly policy: VeracityPolicy,
  ) {
    this.rescore = makeRescorer(policy);
  }

  findInBounds(bbox: BBox, statuses: IncidentStatus[], since?: Date): Promise<Incident[]> {
    return this.incidents.findInBounds({ bbox, statuses, since, limit: 2_000 });
  }

  async getById(id: string): Promise<Incident> {
    const incident = await this.incidents.findById(id);
    if (!incident) throw new IncidentNotFound('Incidente no encontrado', { id });
    return incident;
  }

  async report(cmd: ReportIncidentCommand, actor: AccessProfile): Promise<Incident> {
    if (!isInsideBBox(cmd, PIURA_BBOX)) {
      throw new OutOfCoverageArea('El reporte está fuera del área de cobertura (Piura)');
    }
    if (cmd.photos.length > MAX_PHOTOS_PER_INCIDENT) {
      throw new InvalidPhoto(`Máximo ${MAX_PHOTOS_PER_INCIDENT} fotos por reporte`);
    }

    // Validar TODAS antes de subir ninguna.
    const inspected = cmd.photos.map((buf) => ({ buf, info: inspectPhoto(buf) }));
    const now = new Date();
    const stored: IncidentPhoto[] = await Promise.all(
      inspected.map(async ({ buf, info }) => {
        const ext = info.mimeType === 'image/webp' ? 'webp' : 'jpg';
        const key = `incidents/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;
        await this.photos.put(key, buf, info.mimeType);
        return { storageKey: key, ...info };
      }),
    );
    // Si create() falla quedan objetos huérfanos en S3: los limpia una regla de ciclo de vida
    // sobre objetos sin la etiqueta `linked=true` (se etiquetan en un paso asíncrono posterior).

    const isBrigade = hasPermission(actor.permissions, PERMISSIONS.IncidentsVoteBrigade);
    const incident = await this.incidents.create({
      type: cmd.type,
      severity: cmd.severity,
      title: cmd.title,
      description: cmd.description,
      lat: cmd.lat,
      lng: cmd.lng,
      district: cmd.district ?? null,
      source: isBrigade ? 'BRIGADE' : 'CITIZEN',
      externalRef: null,
      reporterId: actor.userId,
      occurredAt: cmd.occurredAt ?? now,
      photos: stored,
    });

    await this.events.incidentCreated(incident);
    return incident;
  }

  /**
   * Confirmar / desmentir. Reglas:
   *  - geocerca: el votante debe estar a ≤ 500 m (medido en servidor; el cliente solo lo pre-valida para UX),
   *  - un voto por usuario (votar de nuevo reemplaza el anterior),
   *  - nadie vota su propio reporte,
   *  - tras cada voto se recalcula el score y, si cruza el umbral, se escala a VERIFIED y se alerta.
   */
  async vote(incidentId: string, cmd: CastVoteCommand, actor: AccessProfile): Promise<Incident> {
    const incident = await this.getById(incidentId);

    if (incident.status === 'RESOLVED') throw new IncidentClosed('El incidente ya fue resuelto');
    if (incident.reporterId === actor.userId) throw new SelfVoteNotAllowed('No puedes validar tu propio reporte');
    if (cmd.accuracyM > MAX_GPS_ACCURACY_M) {
      throw new GeofenceViolation('Señal GPS demasiado imprecisa para validar', { accuracyM: cmd.accuracyM });
    }

    const distanceM = haversineMeters(cmd, incident);
    if (distanceM > GEOFENCE_RADIUS_M) {
      throw new GeofenceViolation(`Debes estar a menos de ${GEOFENCE_RADIUS_M} m del incidente`, {
        distanceM: Math.round(distanceM),
      });
    }

    AuditContext.recordBefore(incident.id, pickScore(incident));

    const isBrigade = cmd.kind === 'CONFIRM' && hasPermission(actor.permissions, PERMISSIONS.IncidentsVoteBrigade);
    const { incident: updated, previousStatus } = await this.incidents.applyVote(
      {
        incidentId,
        userId: actor.userId,
        kind: cmd.kind,
        weight: userWeight(actor.reputation, this.policy),
        isBrigade,
        distanceM,
        lat: cmd.lat,
        lng: cmd.lng,
      },
      this.rescore,
    );

    await this.events.voteRegistered(updated, {
      incidentId,
      kind: cmd.kind,
      veracityScore: updated.veracityScore,
      confirmCount: updated.confirmCount,
      denyCount: updated.denyCount,
      status: updated.status,
    });
    if (previousStatus !== 'VERIFIED' && updated.status === 'VERIFIED') {
      await this.events.incidentVerified(updated);
    }
    return updated;
  }

  /** Triaje de Defensa Civil: severidad y estado, con bloqueo optimista. */
  async triage(incidentId: string, cmd: TriageCommand): Promise<Incident> {
    const before = await this.getById(incidentId);
    AuditContext.recordBefore(before.id, { severity: before.severity, status: before.status, version: before.version });

    const { expectedVersion, ...patch } = cmd;
    const updated = await this.incidents.updateTriage(incidentId, patch, expectedVersion);
    if (!updated) {
      throw new StaleVersion('El incidente fue modificado por otra persona; recarga e intenta de nuevo', {
        expectedVersion,
      });
    }

    await this.events.incidentUpdated(updated);
    if (before.status !== 'VERIFIED' && updated.status === 'VERIFIED') await this.events.incidentVerified(updated);
    return updated;
  }

  photoUrl(storageKey: string): string {
    return this.photos.publicUrl(storageKey);
  }
}

const pickScore = (i: Incident) => ({
  status: i.status,
  veracityScore: i.veracityScore,
  confirmCount: i.confirmCount,
  denyCount: i.denyCount,
});
