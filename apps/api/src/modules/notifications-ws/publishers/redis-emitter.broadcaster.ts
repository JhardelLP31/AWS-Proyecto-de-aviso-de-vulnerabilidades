import { Emitter } from '@socket.io/redis-emitter';
import { WS_NAMESPACE } from '@geoalert/contracts';
import { Redis } from 'ioredis';
import type { RoomBroadcaster } from '../rooms';

/**
 * Lambda no puede mantener conexiones WebSocket. La API (Lambda) publica en Redis
 * y el servidor Socket.io (Fargate, con @socket.io/redis-adapter) entrega a los clientes.
 * El cliente Redis se crea una vez por contenedor y se reutiliza entre invocaciones.
 */
export class RedisEmitterBroadcaster implements RoomBroadcaster {
  private readonly emitter: ReturnType<Emitter['of']>;

  constructor(redisUrl: string) {
    const client = new Redis(redisUrl, { lazyConnect: false, maxRetriesPerRequest: 2, enableOfflineQueue: true });
    this.emitter = new Emitter(client).of(WS_NAMESPACE);
  }

  broadcast(rooms: string[], event: string, payload: unknown): void {
    this.emitter.to(rooms).emit(event, payload);
  }
}
