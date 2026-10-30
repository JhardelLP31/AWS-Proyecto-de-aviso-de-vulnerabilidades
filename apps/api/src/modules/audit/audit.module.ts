import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { AuditContext } from './application/audit-context';
import { AUDIT_SINK, AuditService } from './application/audit.service';
import { AuditInterceptor } from './presentation/audit.interceptor';

/** Abre el AsyncLocalStorage antes de guards/interceptors para que todo el request comparta contexto. */
function auditContextMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  AuditContext.run(next);
}

@Global()
@Module({
  providers: [
    {
      provide: AUDIT_SINK,
      useFactory: async () => {
        const sinks = await import('./infrastructure/audit.sinks');
        return env.incidentsDriver === 'postgres' ? new sinks.PrismaAuditSink() : new sinks.ConsoleAuditSink();
      },
    },
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
  exports: [AuditService],
})
export class AuditModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(auditContextMiddleware).forRoutes('*');
  }
}
