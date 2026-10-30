import { Module, Provider } from '@nestjs/common';
import { env } from '../../config/env';
import { INCIDENT_EVENTS } from '../incidents/domain/ports';
import { IncidentsGateway } from './incidents.gateway';
import { IncidentEventsPublisher } from './publishers/incident-events.publisher';
import { ROOM_BROADCASTER } from './rooms';

/**
 * REALTIME_DRIVER=inprocess → el Gateway vive en este proceso (desarrollo, contenedor único).
 * REALTIME_DRIVER=redis     → Lambda: sin Gateway; se publica vía Redis al servidor realtime.
 */
const transport: Provider[] =
  env.realtimeDriver === 'inprocess'
    ? [IncidentsGateway, { provide: ROOM_BROADCASTER, useExisting: IncidentsGateway }]
    : [
        {
          provide: ROOM_BROADCASTER,
          useFactory: async () => {
            const { RedisEmitterBroadcaster } = await import('./publishers/redis-emitter.broadcaster');
            return new RedisEmitterBroadcaster(env.redisUrl);
          },
        },
      ];

@Module({
  providers: [...transport, { provide: INCIDENT_EVENTS, useClass: IncidentEventsPublisher }],
  exports: [INCIDENT_EVENTS],
})
export class NotificationsWsModule {}

/** Módulo del servidor realtime dedicado (Fargate): solo el Gateway. */
@Module({ providers: [IncidentsGateway] })
export class RealtimeGatewayModule {}
