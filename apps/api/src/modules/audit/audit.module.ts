import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { env } from '../../config/env';
import { ConsoleAuditSink } from './repositories/console-audit.sink';
import { TypeOrmAuditSink } from './repositories/typeorm-audit.sink';
import { AuditService } from './services/audit.service';
import { AUDIT_SINK, IAuditSink } from './types/audit.types';

@Global()
@Module({
  providers: [
    {
      provide: AUDIT_SINK,
      inject: [{ token: DataSource, optional: true }],
      useFactory: (db?: DataSource): IAuditSink =>
        env.dataDriver === 'postgres' && db ? new TypeOrmAuditSink(db) : new ConsoleAuditSink(),
    },
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService],
})
export class AuditModule {}
