import { Module } from '@nestjs/common';
import { env } from '../../config/env';
import { getPrisma } from '../../shared/prisma/prisma.provider';
import { NotificationsWsModule } from '../notifications-ws/notifications-ws.module';
import { IncidentService } from './application/incident.service';
import { INCIDENT_REPOSITORY, IIncidentRepository, PHOTO_STORAGE } from './domain/ports';
import { DEFAULT_VERACITY_POLICY, VERACITY_POLICY } from './domain/veracity';
import { LocalPhotoStorage, S3PhotoStorage } from './infrastructure/photo-storage';
import { IncidentsController } from './presentation/incidents.controller';

/**
 * Inversión de dependencias: IncidentService solo conoce IIncidentRepository.
 * INCIDENTS_DRIVER=mock     → LocalMockIncidentRepository (5 000 registros INDECI en memoria)
 * INCIDENTS_DRIVER=postgres → PostgresIncidentRepository (Prisma + PostGIS)
 */
@Module({
  imports: [NotificationsWsModule],
  controllers: [IncidentsController],
  providers: [
    IncidentService,
    {
      provide: INCIDENT_REPOSITORY,
      useFactory: async (): Promise<IIncidentRepository> => {
        if (env.incidentsDriver === 'postgres') {
          const { PostgresIncidentRepository } = await import('./infrastructure/postgres-incident.repository');
          return new PostgresIncidentRepository(await getPrisma());
        }
        const { LocalMockIncidentRepository } = await import('./infrastructure/local-mock-incident.repository');
        return LocalMockIncidentRepository.load(env.mockDatasetPath);
      },
    },
    {
      provide: PHOTO_STORAGE,
      useFactory: () =>
        env.photoDriver === 's3'
          ? new S3PhotoStorage(env.s3Bucket, env.photoPublicBaseUrl)
          : new LocalPhotoStorage(env.localPhotoDir, env.photoPublicBaseUrl),
    },
    { provide: VERACITY_POLICY, useValue: DEFAULT_VERACITY_POLICY },
  ],
})
export class IncidentsModule {}
