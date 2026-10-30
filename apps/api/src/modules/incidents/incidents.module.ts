import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { env } from '../../config/env';
import { NotificationsWsModule } from '../notifications-ws/notifications-ws.module';
import { LocalPhotoStorage, S3PhotoStorage } from './adapters/photo-storage';
import { IncidentsController } from './controllers/incidents.controller';
import { PHOTO_STORAGE } from './domain/ports';
import { DEFAULT_VERACITY_POLICY, VERACITY_POLICY } from './domain/veracity';
import { IIncidentRepository, INCIDENT_REPOSITORY } from './repositories/incident.repository';
import { MockIncidentRepository } from './repositories/mock-incident.repository';
import { TypeOrmIncidentRepository } from './repositories/typeorm-incident.repository';
import { IncidentsService } from './services/incidents.service';

/**
 * Inversión de dependencias: IncidentsService solo conoce IIncidentRepository.
 *   DATA_DRIVER=mock     → MockIncidentRepository (5 000 registros INDECI en memoria)
 *   DATA_DRIVER=postgres → TypeOrmIncidentRepository (PostgreSQL + PostGIS)
 */
@Module({
  imports: [NotificationsWsModule],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    {
      provide: INCIDENT_REPOSITORY,
      inject: [{ token: DataSource, optional: true }],
      useFactory: async (db?: DataSource): Promise<IIncidentRepository> =>
        env.dataDriver === 'postgres' && db
          ? new TypeOrmIncidentRepository(db)
          : MockIncidentRepository.load(env.mockDatasetPath),
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
