import type { IncidentStatus } from '@geoalert/contracts';
import type { Rescorer } from '../domain/veracity';
import type { BoundsQuery, Incident, NewIncident, TriagePatch, Vote } from '../types/incident.types';

export interface VoteOutcome {
  incident: Incident;
  previousStatus: IncidentStatus;
  /** true si el usuario ya había votado y cambió su voto. */
  replacedPreviousVote: boolean;
}

/**
 * Puerto de persistencia. Implementaciones intercambiables por configuración:
 *  - MockIncidentRepository: matriz histórica INDECI/GeoSINPAD (5 000 registros) en memoria.
 *  - TypeOrmIncidentRepository: PostgreSQL + PostGIS.
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
