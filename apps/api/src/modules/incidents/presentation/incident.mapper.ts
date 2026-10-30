import type { IncidentDTO } from '@geoalert/contracts';
import type { Incident } from '../domain/incident';

/** Dominio → contrato público. Nunca exponer externalRef, version interna ni claves de S3 crudas. */
export function toIncidentDTO(i: Incident, photoUrl: (key: string) => string): IncidentDTO & { version: number } {
  return {
    id: i.id,
    type: i.type,
    severity: i.severity,
    status: i.status,
    title: i.title,
    description: i.description,
    lat: i.lat,
    lng: i.lng,
    district: i.district,
    veracityScore: i.veracityScore,
    confirmCount: i.confirmCount,
    denyCount: i.denyCount,
    photos: i.photos.map((p) => ({ url: photoUrl(p.storageKey), width: p.width, height: p.height })),
    source: i.source,
    reporterId: i.reporterId,
    occurredAt: i.occurredAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    version: i.version, // necesario para el bloqueo optimista del triaje
  };
}
