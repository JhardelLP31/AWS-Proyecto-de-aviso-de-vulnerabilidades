import type { BBox, IncidentSource, IncidentStatus, IncidentType, Severity, VoteKind } from '@geoalert/contracts';

export interface IncidentPhoto {
  storageKey: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}

export interface Incident {
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
  source: IncidentSource;
  externalRef: string | null;
  reporterId: string | null;
  occurredAt: Date;
  verifiedAt: Date | null;
  resolvedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  photos: IncidentPhoto[];
}

export type NewIncident = Pick<
  Incident,
  'type' | 'severity' | 'title' | 'description' | 'lat' | 'lng' | 'district' | 'source' | 'externalRef' | 'reporterId' | 'occurredAt' | 'photos'
> & { status?: IncidentStatus };

export interface Vote {
  incidentId: string;
  userId: string;
  kind: VoteKind;
  /** w_u congelado al momento de votar. */
  weight: number;
  isBrigade: boolean;
  distanceM: number;
  lat: number;
  lng: number;
}

export interface TriagePatch {
  severity?: Severity;
  status?: IncidentStatus;
}

export interface BoundsQuery {
  bbox: BBox;
  statuses: IncidentStatus[];
  since?: Date;
  limit: number;
}
