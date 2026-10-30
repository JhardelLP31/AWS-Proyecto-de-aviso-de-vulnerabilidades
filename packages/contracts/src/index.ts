// Contratos compartidos entre apps/api y apps/web.
// Todo lo que cruza la red (DTOs, eventos WebSocket, permisos) se define aquí una sola vez.

export * from './geo';

export const INCIDENT_TYPES = [
  'RIVER_OVERFLOW', // Desborde de río
  'BLIND_BASIN_COLLAPSE', // Cuenca ciega colapsada
  'DIKE_BREACH', // Rotura de dique
  'ISOLATED_AREA', // Zona aislada
  'FLOODED_ROAD', // Vía inundada / intransitable
  'LANDSLIDE', // Huaico / deslizamiento
  'OTHER',
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

/** Capas semafóricas del mapa. El orden importa: índice mayor = más grave. */
export const SEVERITIES = ['GREEN', 'YELLOW', 'ORANGE', 'RED'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const INCIDENT_STATUSES = ['PENDING', 'VERIFIED', 'DISMISSED', 'RESOLVED'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SOURCES = ['CITIZEN', 'BRIGADE', 'INDECI_IMPORT'] as const;
export type IncidentSource = (typeof INCIDENT_SOURCES)[number];

export type VoteKind = 'CONFIRM' | 'DENY';

export interface IncidentPhotoDTO {
  url: string;
  width: number;
  height: number;
}

export interface IncidentDTO {
  id: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  description: string;
  lat: number;
  lng: number;
  district: string | null;
  veracityScore: number;
  confirmCount: number;
  denyCount: number;
  photos: IncidentPhotoDTO[];
  source: IncidentSource;
  reporterId: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeDTO {
  id: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

/** Respuesta de POST /auth/login y /auth/register. Guardar csrfToken SOLO en memoria. */
export interface SessionResponse {
  user: MeDTO;
  csrfToken: string;
}

/** Incidente tal como lo devuelve la API (incluye `version` para el bloqueo optimista del triaje). */
export type IncidentResponse = IncidentDTO & { version: number };

// ---------------------------------------------------------------------------
// Peticiones (v1). El backend las valida con class-validator; el frontend las usa como tipos.
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  /** ≥ 10 caracteres con mayúscula, minúscula y dígito. */
  password: string;
  displayName: string;
  district?: string;
  /** Celular peruano: 9XXXXXXXX o +519XXXXXXXX. */
  phone?: string;
}

/**
 * POST /api/incidents como multipart/form-data: estos campos como texto
 * + hasta MAX_PHOTOS_PER_INCIDENT archivos en el campo `photos` (WebP ≤ MAX_PHOTO_BYTES).
 */
export interface CreateIncidentRequest {
  type: IncidentType;
  severity: Severity;
  title: string;
  description: string;
  lat: number;
  lng: number;
  district?: string;
  occurredAt?: string;
}

/** POST /api/incidents/:id/votes */
export interface CastVoteRequest {
  kind: VoteKind;
  lat: number;
  lng: number;
  /** GeolocationCoordinates.accuracy en metros (máx. 250 para votar). */
  accuracyM: number;
}

/** PATCH /api/incidents/:id/triage — al menos severity o status. */
export interface TriageRequest {
  severity?: Severity;
  status?: IncidentStatus;
  expectedVersion: number;
}

/** Errores de negocio (403/404/409/422) */
export interface DomainApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Errores de validación (400) y de framework (401/403/429) */
export interface FrameworkApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export type ApiError = DomainApiError | FrameworkApiError;

export const DOMAIN_ERROR_CODES = [
  'INCIDENT_NOT_FOUND',
  'GEOFENCE_VIOLATION',
  'SELF_VOTE_NOT_ALLOWED',
  'INCIDENT_CLOSED',
  'INVALID_PHOTO',
  'OUT_OF_COVERAGE_AREA',
  'STALE_VERSION',
  'EMAIL_ALREADY_REGISTERED',
] as const;

/** [minLng, minLat, maxLng, maxLat] — mismo orden que GeoJSON / MapLibre. */
export type BBox = [number, number, number, number];

// ---------------------------------------------------------------------------
// Tiempo real
// ---------------------------------------------------------------------------

export const WS_NAMESPACE = '/incidents';

/** Versión del contrato. Cambio incompatible ⇒ subir mayor y anotarlo en docs/contratos.md. */
export const CONTRACTS_VERSION = '1.1.0';

export const WsEvents = {
  IncidentCreated: 'incident.created',
  IncidentUpdated: 'incident.updated',
  VoteRegistered: 'incident.vote',
  IncidentVerified: 'incident.verified',
  ViewportSubscribe: 'viewport.subscribe',
  DistrictSubscribe: 'district.subscribe',
} as const;

export interface VoteRegisteredPayload {
  incidentId: string;
  kind: VoteKind;
  veracityScore: number;
  confirmCount: number;
  denyCount: number;
  status: IncidentStatus;
}

export interface ViewportSubscribePayload {
  bbox: BBox;
}

/** Sala que reciben Defensa Civil / COER para despacho. */
export const DISPATCH_ROOM = 'dispatch';

export const roomForCell = (geohash: string) => `cell:${geohash}`;
export const roomForDistrict = (district: string) =>
  `district:${district.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}`;

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  IncidentsRead: 'incidents.read',
  IncidentsCreate: 'incidents.create',
  IncidentsVote: 'incidents.vote',
  /** Insignia de brigadista: su voto suma BonusBrigadista. */
  IncidentsVoteBrigade: 'incidents.vote.brigade',
  IncidentsVerify: 'incidents.verify',
  TriageUpdate: 'triage.update',
  AlertsReceive: 'alerts.receive',
  AnalyticsRead: 'analytics.read',
  AuditRead: 'audit.read',
  UsersManage: 'users.manage',
  RolesManage: 'roles.manage',
} as const;
export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Comprueba un permiso contra el conjunto efectivo del usuario.
 * Admite comodines estilo Spatie: `*` y `incidents.*`.
 */
export function hasPermission(granted: Iterable<string>, required: string): boolean {
  for (const g of granted) {
    if (g === '*' || g === required) return true;
    if (g.endsWith('.*') && required.startsWith(g.slice(0, -1))) return true;
  }
  return false;
}

export const GEOFENCE_RADIUS_M = 500;
export const MAX_PHOTO_BYTES = 150 * 1024;
export const MAX_PHOTOS_PER_INCIDENT = 3;

// ---------------------------------------------------------------------------
// Riesgo histórico (datos guía de data/indeci_historico_piura.*)
// ---------------------------------------------------------------------------

/** Aviso que el frontend muestra junto a cualquier estimación: los datos son de referencia. */
export const RISK_DISCLAIMER =
  'Estimación basada en datos históricos de referencia; no es un pronóstico oficial.';

/** GET /api/risk/heatmap?bbox= · una celda de ~1 km con peso normalizado 0..1. */
export interface RiskHeatCell {
  lat: number;
  lng: number;
  /** Suma de severidades de los eventos de la celda, normalizada contra la celda más alta. */
  weight: number;
  events: number;
}

/** GET /api/risk/districts · ranking por distrito, de mayor a menor riesgo. */
export interface DistrictRiskSummary {
  district: string;
  events: number;
  /** Fracción de eventos con severidad RED (0..1). */
  criticalShare: number;
  damnificados: number;
  afectados: number;
  viviendasColapsadas: number;
  /** Vulnerabilidad del suelo media (0..1). */
  soilVulnerability: number;
  lastEventDate: string;
  centroid: { lat: number; lng: number };
  /** Eventos por tipo de peligro, con el nombre del dataset (p. ej. "DESBORDE DE RIO"). */
  byHazard: Record<string, number>;
  /** Puntuación 0..100 para ordenar el ranking. */
  riskScore: number;
}

/** GET /api/risk/forecast?precipitationMm= · severidad esperada por distrito para esa lluvia. */
export interface DistrictForecast {
  district: string;
  expectedSeverity: Severity;
  /** Probabilidad 0..1 de cada severidad, según eventos históricos con lluvia parecida. */
  probabilities: Record<Severity, number>;
  expectedDamnificados: number;
  /** Eventos históricos usados para la estimación. */
  sampleSize: number;
  /** true si no hubo eventos con lluvia parecida y se usaron los más cercanos: mostrar "baja confianza". */
  extrapolated: boolean;
  centroid: { lat: number; lng: number };
}

export interface RiskForecastResponse {
  precipitationMm: number;
  /** Ventana de lluvia (± mm) usada para buscar eventos parecidos. */
  windowMm: number;
  districts: DistrictForecast[];
  disclaimer: string;
  dataset: { source: string; from: string; to: string; events: number };
}
