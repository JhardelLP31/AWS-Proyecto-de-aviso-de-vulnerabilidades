import type { IncidentStatus } from '@geoalert/contracts';
import type { Incident, Vote } from '../types/incident.types';

/**
 * Motor de confianza (Crowd-Verification).
 *
 *   ScoreVeracidad = Σ(confirmaciones × w_u) − Σ(desmentidos) × 1.5 + BonusBrigadista
 *
 * Funciones puras: sin I/O, deterministas y testeables con tablas de casos.
 * Se recalcula SIEMPRE desde el conjunto completo de votos (no con incrementos),
 * así un voto editado o un w_u corregido nunca deja el score desfasado.
 */
export interface VeracityPolicy {
  /** Peso fijo de cada desmentido (según la fórmula especificada). */
  denyWeight: number;
  /** Bonus por cada confirmación de un brigadista con insignia. */
  brigadeBonus: number;
  /** Tope de confirmaciones de brigadista que suman bonus (evita que una sola brigada verifique sola). */
  maxBrigadeBonuses: number;
  /** Umbral crítico: al alcanzarlo, PENDING → VERIFIED y se alerta a Defensa Civil. */
  verifyThreshold: number;
  /** Por debajo, PENDING → DISMISSED (reporte desmentido por la comunidad). */
  dismissThreshold: number;
  minUserWeight: number;
  maxUserWeight: number;
}

export const DEFAULT_VERACITY_POLICY: VeracityPolicy = {
  denyWeight: 1.5,
  brigadeBonus: 4,
  maxBrigadeBonuses: 2,
  verifyThreshold: 8,
  dismissThreshold: -4.5,
  minUserWeight: 0.25,
  maxUserWeight: 3,
};
export const VERACITY_POLICY = Symbol('VERACITY_POLICY');

/** w_u: reputación del usuario acotada (un usuario nuevo vale 1; un histórico confiable hasta 3). */
export function userWeight(reputation: number, policy: VeracityPolicy): number {
  if (!Number.isFinite(reputation)) return policy.minUserWeight;
  return Math.min(policy.maxUserWeight, Math.max(policy.minUserWeight, reputation));
}

export interface VeracityResult {
  veracityScore: number;
  confirmCount: number;
  denyCount: number;
}

export function computeVeracity(
  votes: ReadonlyArray<Pick<Vote, 'kind' | 'weight' | 'isBrigade'>>,
  policy: VeracityPolicy,
): VeracityResult {
  let positive = 0;
  let confirmCount = 0;
  let denyCount = 0;
  let brigadeConfirms = 0;

  for (const v of votes) {
    if (v.kind === 'CONFIRM') {
      positive += v.weight;
      confirmCount++;
      if (v.isBrigade) brigadeConfirms++;
    } else {
      denyCount++;
    }
  }

  const bonus = Math.min(brigadeConfirms, policy.maxBrigadeBonuses) * policy.brigadeBonus;
  const score = positive - denyCount * policy.denyWeight + bonus;
  return { veracityScore: Math.round(score * 100) / 100, confirmCount, denyCount };
}

/**
 * Transiciones automáticas permitidas:
 *   PENDING   → VERIFIED  (score ≥ verifyThreshold)
 *   PENDING   → DISMISSED (score ≤ dismissThreshold)
 *   DISMISSED → VERIFIED  (la comunidad lo reactiva con evidencia nueva)
 * VERIFIED y RESOLVED solo cambian por triaje humano (permiso triage.update):
 * un ataque de desmentidos masivos no puede "apagar" una alerta ya verificada.
 */
export function nextStatus(current: IncidentStatus, score: number, policy: VeracityPolicy): IncidentStatus {
  if (current === 'VERIFIED' || current === 'RESOLVED') return current;
  if (score >= policy.verifyThreshold) return 'VERIFIED';
  if (current === 'PENDING' && score <= policy.dismissThreshold) return 'DISMISSED';
  return current;
}

export type RescoreResult = VeracityResult & Pick<Incident, 'status' | 'verifiedAt'>;
export type Rescorer = (votes: ReadonlyArray<Vote>, current: Incident) => RescoreResult;

export function makeRescorer(policy: VeracityPolicy, now: () => Date = () => new Date()): Rescorer {
  return (votes, current) => {
    const result = computeVeracity(votes, policy);
    const status = nextStatus(current.status, result.veracityScore, policy);
    const verifiedAt = status === 'VERIFIED' && current.status !== 'VERIFIED' ? now() : current.verifiedAt;
    return { ...result, status, verifiedAt };
  };
}
