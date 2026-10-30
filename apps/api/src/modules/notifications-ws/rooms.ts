import { DISPATCH_ROOM, realtimeCellsForPoint, roomForCell, roomForDistrict } from '@geoalert/contracts';
import { env } from '../../config/env';
import type { Incident } from '../incidents/types/incident.types';
import { toIncidentDTO } from '../incidents/dto/incident-response.mapper';

/**
 * Un evento se emite a: celdas geohash (precisión 5 y 4) que cubren el punto,
 * la sala del distrito y la sala de despacho. Socket.io deduplica: un cliente
 * presente en varias salas recibe el evento una sola vez.
 */
export function roomsForIncident(i: Incident): string[] {
  const rooms = realtimeCellsForPoint(i).map(roomForCell);
  if (i.district) rooms.push(roomForDistrict(i.district));
  rooms.push(DISPATCH_ROOM);
  return rooms;
}

export const toWirePayload = (i: Incident) => toIncidentDTO(i, (key) => `${env.photoPublicBaseUrl}/${key}`);

/** Transporte de difusión: Socket.io en el mismo proceso, o Redis emitter desde Lambda. */
export interface RoomBroadcaster {
  broadcast(rooms: string[], event: string, payload: unknown): void;
}
export const ROOM_BROADCASTER = Symbol('ROOM_BROADCASTER');
