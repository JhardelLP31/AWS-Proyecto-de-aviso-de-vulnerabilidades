import { Controller, Get, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Public } from './common/decorators';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { auditContextMiddleware } from './common/middlewares/audit-context.middleware';
import { CsrfMiddleware } from './common/middlewares/csrf.middleware';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware';
import { env } from './config/env';
import { DatabaseModule } from './database/database.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RiskModule } from './modules/risk/risk.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { RbacModule } from './modules/rbac/rbac.module';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', data: env.dataDriver, time: new Date().toISOString() };
  }
}

@Module({
  imports: [
    // Por instancia. En Lambda cada contenedor cuenta por separado: el límite real
    // por IP debe vivir en AWS WAF (rate-based rule) delante de API Gateway / CloudFront.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    ...(env.dataDriver === 'postgres' ? [DatabaseModule] : []),
    AuditModule,
    AuthModule,
    RbacModule,
    IncidentsModule,
    AnalyticsModule,
    RiskModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  /** Orden: id de correlación → contexto de auditoría → CSRF. Después corren guards e interceptors. */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware, auditContextMiddleware, CsrfMiddleware).forRoutes('*');
  }
}
