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

/** [minLng, minLat, maxLng, maxLat] — mismo orden que GeoJSON / MapLibre. */
export type BBox = [number, number, number, number];

// ---------------------------------------------------------------------------
// Tiempo real
// ---------------------------------------------------------------------------

export const WS_NAMESPACE = '/incidents';

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
