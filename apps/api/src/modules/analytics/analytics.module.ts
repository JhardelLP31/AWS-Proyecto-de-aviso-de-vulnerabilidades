import { Controller, Get, Module, Query } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { PERMISSIONS } from '@geoalert/contracts';
import { RequirePermissions } from '../../common/decorators';

/**
 * Carga perezosa: el motor de analítica (agregaciones, heatmaps) no se importa en el
 * cold start; se carga la primera vez que alguien con `analytics.read` abre el panel.
 */
@Controller('analytics')
class AnalyticsController {
  constructor(private readonly lazy: LazyModuleLoader) {}

  @Get('summary')
  @RequirePermissions(PERMISSIONS.AnalyticsRead)
  async summary(@Query('days') days = '7') {
    const { AnalyticsEngineModule, AnalyticsEngine } = await import('./analytics-engine');
    const ref = await this.lazy.load(() => AnalyticsEngineModule);
    return ref.get(AnalyticsEngine).summary(Math.min(Number(days) || 7, 90));
  }
}

@Module({ controllers: [AnalyticsController] })
export class AnalyticsModule {}
