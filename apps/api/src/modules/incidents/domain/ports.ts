import type { VoteRegisteredPayload } from '@geoalert/contracts';
import type { Incident } from '../types/incident.types';

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
