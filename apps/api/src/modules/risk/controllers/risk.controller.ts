import { Controller, Get, Header, Query } from '@nestjs/common';
import { PERMISSIONS } from '@geoalert/contracts';
import { Public, RequirePermissions } from '../../../common/decorators';
import { ForecastQueryDto, HeatmapQueryDto } from '../dto/risk-query.dto';
import { RiskService } from '../services/risk.service';

/** Datos históricos de referencia: no cambian entre despliegues, así que se pueden cachear. */
const CACHE = 'public, max-age=3600';

@Controller('risk')
export class RiskController {
  constructor(private readonly risk: RiskService) {}

  /** Capa del mapa: pública, como el resto del mapa. */
  @Public()
  @Get('heatmap')
  @Header('Cache-Control', CACHE)
  heatmap(@Query() q: HeatmapQueryDto) {
    return this.risk.heatmap(q.bbox);
  }

  @Get('districts')
  @RequirePermissions(PERMISSIONS.AnalyticsRead)
  districts() {
    return this.risk.districts();
  }

  @Get('forecast')
  @RequirePermissions(PERMISSIONS.AnalyticsRead)
  forecast(@Query() q: ForecastQueryDto) {
    return this.risk.forecast(q.precipitationMm);
  }
}
