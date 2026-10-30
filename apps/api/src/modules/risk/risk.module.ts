import { Module } from '@nestjs/common';
import { env } from '../../config/env';
import { RiskController } from './controllers/risk.controller';
import { FileHistoricalEventsRepository, HISTORICAL_EVENTS } from './repositories/historical-events.repository';
import { RiskService } from './services/risk.service';

@Module({
  controllers: [RiskController],
  providers: [
    RiskService,
    { provide: HISTORICAL_EVENTS, useFactory: () => new FileHistoricalEventsRepository(env.riskDatasetPath) },
  ],
})
export class RiskModule {}
