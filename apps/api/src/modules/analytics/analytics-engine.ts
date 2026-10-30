import { Injectable, Module } from '@nestjs/common';

/** Placeholder del motor pesado (Fase 4): agregados por distrito, tiempos de verificación, heatmap. */
@Injectable()
export class AnalyticsEngine {
  async summary(days: number) {
    return { windowDays: days, generatedAt: new Date().toISOString(), byDistrict: [], meanTimeToVerifyMin: null };
  }
}

@Module({ providers: [AnalyticsEngine] })
export class AnalyticsEngineModule {}
