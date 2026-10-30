import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { Public } from './modules/rbac/presentation/rbac.decorators';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}

@Module({
  imports: [
    // Por instancia. En Lambda cada contenedor cuenta por separado: el límite real
    // por IP debe vivir en AWS WAF (rate-based rule) delante de API Gateway / CloudFront.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    AuditModule,
    AuthModule,
    RbacModule,
    IncidentsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
