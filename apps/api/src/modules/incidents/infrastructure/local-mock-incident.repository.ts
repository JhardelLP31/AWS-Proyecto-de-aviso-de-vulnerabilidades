import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { BoundsQuery, Incident, NewIncident, TriagePatch, Vote } from '../domain/incident';
import type { IIncidentRepository, VoteOutcome } from '../domain/ports';
import type { Rescorer } from '../domain/veracity';
import { IndeciRecord, mapIndeciRecord } from './indeci.mapper';
import { generateSyntheticIndeci } from './synthetic-dataset';

const SEVERITY_RANK = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 } as const;

/**
 * Repositorio en memoria cargado con la matriz histórica INDECI/GeoSINPAD (5 000 registros).
 * Si MOCK_DATASET_PATH no existe, usa el generador sintético determinista.
 *
 * Cada método es síncrono por dentro (sin await entre leer y escribir), por lo que en el
 * event loop de Node las operaciones son atómicas sin necesidad de locks.
 * Estado por proceso: en Lambda cada contenedor tiene su copia (válido solo para demo).
 */
export class LocalMockIncidentRepository implements IIncidentRepository {
  private readonly logger = new Logger(LocalMockIncidentRepository.name);
  private readonly incidents = new Map<string, Incident>();
  private readonly votes = new Map<string, Map<string, Vote>>();

  static async load(datasetPath: string): Promise<LocalMockIncidentRepository> {
    const repo = new LocalMockIncidentRepository();
    let records: IndeciRecord[];
    try {
      records = JSON.parse(await readFile(datasetPath, 'utf8')) as IndeciRecord[];
      repo.logger.log(`Dataset INDECI cargado desde ${datasetPath}: ${records.length} registros`);
    } catch {
      records = generateSyntheticIndeci();
      repo.logger.warn(`No se encontró ${datasetPath}; usando ${records.length} registros sintéticos`);
    }
    for (const r of records) {
      try {
        repo.insert(mapIndeciRecord(r));
      } catch (err) {
        repo.logger.warn(`Registro descartado: ${(err as Error).message}`);
      }
    }
    return repo;
  }

  async findById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) ?? null;
  }

  async findInBounds({ bbox: [minLng, minLat, maxLng, maxLat], statuses, since, limit }: BoundsQuery): Promise<Incident[]> {
    const out: Incident[] = [];
    for (const i of this.incidents.values()) {
      if (i.lng < minLng || i.lng > maxLng || i.lat < minLat || i.lat > maxLat) continue;
      if (statuses.length && !statuses.includes(i.status)) continue;
      if (since && i.occurredAt < since) continue;
      out.push(i);
    }
    return out
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || +b.occurredAt - +a.occurredAt)
      .slice(0, limit);
  }

  async create(data: NewIncident): Promise<Incident> {
    return this.insert(data);
  }

  async applyVote(vote: Vote, rescore: Rescorer): Promise<VoteOutcome> {
    const current = this.incidents.get(vote.incidentId);
    if (!current) throw new Error(`Incidente ${vote.incidentId} no existe`);

    const byUser = this.votes.get(vote.incidentId) ?? new Map<string, Vote>();
    const replacedPreviousVote = byUser.has(vote.userId);
    byUser.set(vote.userId, vote);
    this.votes.set(vote.incidentId, byUser);

    const result = rescore([...byUser.values()], current);
    const updated: Incident = { ...current, ...result, version: current.version + 1, updatedAt: new Date() };
    this.incidents.set(updated.id, updated);
    return { incident: updated, previousStatus: current.status, replacedPreviousVote };
  }

  async updateTriage(id: string, patch: TriagePatch, expectedVersion: number): Promise<Incident | null> {
    const current = this.incidents.get(id);
    if (!current || current.version !== expectedVersion) return null;
    const now = new Date();
    const updated: Incident = {
      ...current,
      ...patch,
      verifiedAt: patch.status === 'VERIFIED' && !current.verifiedAt ? now : current.verifiedAt,
      resolvedAt: patch.status === 'RESOLVED' ? now : current.resolvedAt,
      version: current.version + 1,
      updatedAt: now,
    };
    this.incidents.set(id, updated);
    return updated;
  }

  private insert(data: NewIncident): Incident {
    const now = new Date();
    const incident: Incident = {
      ...data,
      id: randomUUID(),
      status: data.status ?? 'PENDING',
      veracityScore: 0,
      confirmCount: 0,
      denyCount: 0,
      verifiedAt: data.status === 'VERIFIED' ? data.occurredAt : null,
      resolvedAt: data.status === 'RESOLVED' ? data.occurredAt : null,
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }
}
