import type { IncidentStatus, VoteRegisteredPayload } from '@geoalert/contracts';
import type { BoundsQuery, Incident, NewIncident, TriagePatch, Vote } from './incident';
import type { Rescorer } from './veracity';

export interface VoteOutcome {
  incident: Incident;
  previousStatus: IncidentStatus;
  /** true si el usuario ya había votado y cambió su voto. */
  replacedPreviousVote: boolean;
}

/**
 * Puerto de persistencia. Implementaciones intercambiables por configuración:
 *  - LocalMockIncidentRepository: matriz histórica INDECI/GeoSINPAD (5 000 registros) en memoria.
 *  - PostgresIncidentRepository: Prisma + PostGIS.
 */
export interface IIncidentRepository {
  findById(id: string): Promise<Incident | null>;
  findInBounds(query: BoundsQuery): Promise<Incident[]>;
  create(data: NewIncident): Promise<Incident>;
  /**
   * Operación ATÓMICA: inserta o reemplaza el voto del usuario (único por incidente),
   * recalcula el score con todos los votos y persiste el nuevo estado.
   */
  applyVote(vote: Vote, rescore: Rescorer): Promise<VoteOutcome>;
  /** Devuelve null si `expectedVersion` no coincide (bloqueo optimista). */
  updateTriage(id: string, patch: TriagePatch, expectedVersion: number): Promise<Incident | null>;
}
export const INCIDENT_REPOSITORY = Symbol('INCIDENT_REPOSITORY');

/** Puerto de notificación en tiempo real (Socket.io en proceso o Redis emitter desde Lambda). */
export interface IIncidentEventsPublisher {
  incidentCreated(incident: Incident): Promise<void>;
  incidentUpdated(incident: Incident): Promise<void>;
  voteRegistered(incident: Incident, payload: VoteRegisteredPayload): Promise<void>;
  incidentVerified(incident: Incident): Promise<void>;
}
export const INCIDENT_EVENTS = Symbol('INCIDENT_EVENTS');

export interface IPhotoStorage {
  put(key: string, body: Buffer, mimeType: string): Promise<void>;
  publicUrl(key: string): string;
}
export const PHOTO_STORAGE = Symbol('PHOTO_STORAGE');
