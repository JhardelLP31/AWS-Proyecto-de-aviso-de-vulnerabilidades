import { Inject, Injectable, Logger } from '@nestjs/common';
import { DISPATCH_ROOM, VoteRegisteredPayload, WsEvents } from '@geoalert/contracts';
import type { Incident } from '../../incidents/domain/incident';
import type { IIncidentEventsPublisher } from '../../incidents/domain/ports';
import { ROOM_BROADCASTER, RoomBroadcaster, roomsForIncident, toWirePayload } from '../rooms';

/**
 * Adaptador del puerto IIncidentEventsPublisher. No sabe si el transporte es Socket.io local
 * o Redis: eso lo decide ROOM_BROADCASTER. Un fallo de difusión nunca revierte el caso de uso
 * (el dato ya está persistido; los clientes se resincronizan al reconectar).
 */
@Injectable()
export class IncidentEventsPublisher implements IIncidentEventsPublisher {
  private readonly logger = new Logger(IncidentEventsPublisher.name);

  constructor(@Inject(ROOM_BROADCASTER) private readonly transport: RoomBroadcaster) {}

  async incidentCreated(i: Incident): Promise<void> {
    this.send(roomsForIncident(i), WsEvents.IncidentCreated, toWirePayload(i));
  }

  async incidentUpdated(i: Incident): Promise<void> {
    this.send(roomsForIncident(i), WsEvents.IncidentUpdated, toWirePayload(i));
  }

  async voteRegistered(i: Incident, payload: VoteRegisteredPayload): Promise<void> {
    this.send(roomsForIncident(i), WsEvents.VoteRegistered, payload);
  }

  /** Escalamiento automático: Defensa Civil recibe la alerta aunque no esté mirando esa zona. */
  async incidentVerified(i: Incident): Promise<void> {
    this.send([DISPATCH_ROOM, ...roomsForIncident(i)], WsEvents.IncidentVerified, toWirePayload(i));
  }

  private send(rooms: string[], event: string, payload: unknown): void {
    try {
      this.transport.broadcast(rooms, event, payload);
    } catch (err) {
      this.logger.error(`Fallo al difundir ${event}: ${(err as Error).message}`);
    }
  }
}
