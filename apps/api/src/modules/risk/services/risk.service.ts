import { Inject, Injectable } from '@nestjs/common';
import { type BBox, RISK_DISCLAIMER, type RiskForecastResponse } from '@geoalert/contracts';
import { districtRanking, forecast, heatmap } from '../domain/risk-model';
import { HISTORICAL_EVENTS, type IHistoricalEventsRepository } from '../repositories/historical-events.repository';

@Injectable()
export class RiskService {
  constructor(@Inject(HISTORICAL_EVENTS) private readonly events: IHistoricalEventsRepository) {}

  async heatmap(bbox?: BBox) {
    return heatmap(await this.events.all(), bbox);
  }

  async districts() {
    return districtRanking(await this.events.all());
  }

  async forecast(precipitationMm: number): Promise<RiskForecastResponse> {
    const events = await this.events.all();
    const dates = events.map((e) => e.date).sort();
    return {
      precipitationMm,
      ...forecast(events, precipitationMm),
      disclaimer: RISK_DISCLAIMER,
      dataset: { source: 'INDECI/SINPAD (datos guía)', from: dates[0] ?? '', to: dates.at(-1) ?? '', events: events.length },
    };
  }
}
