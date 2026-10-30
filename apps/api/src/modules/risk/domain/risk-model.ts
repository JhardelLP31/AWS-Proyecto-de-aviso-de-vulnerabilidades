import {
  type BBox,
  type DistrictForecast,
  type DistrictRiskSummary,
  type RiskHeatCell,
  type Severity,
  SEVERITIES,
} from '@geoalert/contracts';
import type { HistoricalEvent } from './historical-event';

// Reglas puras (sin I/O) sobre eventos históricos. El modelo es empírico: no codifica umbrales
// de lluvia, solo cuenta lo que pasó en eventos parecidos, así que cambia solo si cambian los datos.

const SEVERITY_WEIGHT: Record<Severity, number> = { GREEN: 1, YELLOW: 2, ORANGE: 3, RED: 4 };

/** Tamaño de celda del mapa de calor: 0,01° ≈ 1,1 km en Piura. */
export const HEAT_CELL_DEG = 0.01;
/** Ventana inicial de lluvia para el pronóstico, y mínimo de eventos antes de ampliarla. */
export const FORECAST_WINDOW_MM = 10;
export const FORECAST_MIN_SAMPLE = 10;
const FORECAST_MAX_WINDOW_MM = 40;

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits;
const inBBox = (e: HistoricalEvent, [minLng, minLat, maxLng, maxLat]: BBox) =>
  e.lng >= minLng && e.lng <= maxLng && e.lat >= minLat && e.lat <= maxLat;

const groupBy = <T>(items: T[], key: (t: T) => string) => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
};

const centroid = (events: HistoricalEvent[]) => ({
  lat: round(events.reduce((s, e) => s + e.lat, 0) / events.length, 5),
  lng: round(events.reduce((s, e) => s + e.lng, 0) / events.length, 5),
});

export function heatmap(events: HistoricalEvent[], bbox?: BBox): RiskHeatCell[] {
  const cells = new Map<string, { lat: number; lng: number; sum: number; events: number }>();
  for (const e of events) {
    if (bbox && !inBBox(e, bbox)) continue;
    const lat = Math.floor(e.lat / HEAT_CELL_DEG) * HEAT_CELL_DEG + HEAT_CELL_DEG / 2;
    const lng = Math.floor(e.lng / HEAT_CELL_DEG) * HEAT_CELL_DEG + HEAT_CELL_DEG / 2;
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cell = cells.get(key) ?? { lat, lng, sum: 0, events: 0 };
    cell.sum += SEVERITY_WEIGHT[e.severity];
    cell.events += 1;
    cells.set(key, cell);
  }
  const max = Math.max(1, ...[...cells.values()].map((c) => c.sum));
  return [...cells.values()]
    .map((c) => ({ lat: round(c.lat, 4), lng: round(c.lng, 4), weight: round(c.sum / max, 3), events: c.events }))
    .sort((a, b) => b.weight - a.weight);
}

export function districtRanking(events: HistoricalEvent[]): DistrictRiskSummary[] {
  const groups = groupBy(events, (e) => e.district);
  const maxEvents = Math.max(1, ...[...groups.values()].map((g) => g.length));
  const maxDamn = Math.max(1, ...[...groups.values()].map((g) => g.reduce((s, e) => s + e.damnificados, 0)));

  return [...groups.entries()]
    .map(([district, list]) => {
      const critical = list.filter((e) => e.severity === 'RED').length;
      const damnificados = list.reduce((s, e) => s + e.damnificados, 0);
      const soilVulnerability = list.reduce((s, e) => s + e.soilVulnerability, 0) / list.length;
      const criticalShare = critical / list.length;
      const byHazard: Record<string, number> = {};
      for (const e of list) byHazard[e.hazard] = (byHazard[e.hazard] ?? 0) + 1;
      // Frecuencia, gravedad, impacto humano y suelo pesan por igual; cada uno ya está en 0..1.
      const riskScore = 25 * (list.length / maxEvents + criticalShare + damnificados / maxDamn + soilVulnerability);
      return {
        district,
        events: list.length,
        criticalShare: round(criticalShare, 3),
        damnificados,
        afectados: list.reduce((s, e) => s + e.afectados, 0),
        viviendasColapsadas: list.reduce((s, e) => s + e.viviendasColapsadas, 0),
        soilVulnerability: round(soilVulnerability, 3),
        lastEventDate: list.reduce((max, e) => (e.date > max ? e.date : max), list[0].date),
        centroid: centroid(list),
        byHazard,
        riskScore: round(riskScore, 1),
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Para cada distrito, mira los eventos históricos con lluvia parecida (± ventana) y devuelve la
 * distribución de severidades. Si hay pocos eventos, amplía la ventana hasta FORECAST_MAX_WINDOW_MM.
 */
export function forecast(
  events: HistoricalEvent[],
  precipitationMm: number,
): { windowMm: number; districts: DistrictForecast[] } {
  let windowMm = FORECAST_WINDOW_MM;
  const groups = groupBy(events, (e) => e.district);
  const districts: DistrictForecast[] = [];

  for (const [district, list] of groups) {
    let window = FORECAST_WINDOW_MM;
    let sample = list.filter((e) => Math.abs(e.precipitationMm - precipitationMm) <= window);
    while (sample.length < FORECAST_MIN_SAMPLE && window < FORECAST_MAX_WINDOW_MM) {
      window += FORECAST_WINDOW_MM;
      sample = list.filter((e) => Math.abs(e.precipitationMm - precipitationMm) <= window);
    }
    // Lluvia fuera de lo registrado (p. ej. 300 mm): en vez de responder "sin riesgo", se usan los
    // eventos con la lluvia más cercana y se marca la estimación como extrapolada.
    const extrapolated = sample.length < FORECAST_MIN_SAMPLE;
    if (extrapolated) {
      sample = [...list]
        .sort((a, b) => Math.abs(a.precipitationMm - precipitationMm) - Math.abs(b.precipitationMm - precipitationMm))
        .slice(0, FORECAST_MIN_SAMPLE);
    }
    windowMm = Math.max(windowMm, window);

    const probabilities = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
    for (const e of sample) probabilities[e.severity] += 1;
    for (const s of SEVERITIES) probabilities[s] = sample.length ? round(probabilities[s] / sample.length, 3) : 0;

    // Severidad esperada = la más probable; en empate, la más grave (criterio prudente).
    const expectedSeverity = sample.length
      ? [...SEVERITIES].reverse().reduce((best, s) => (probabilities[s] > probabilities[best] ? s : best), 'RED' as Severity)
      : 'GREEN';

    districts.push({
      district,
      expectedSeverity,
      probabilities,
      expectedDamnificados: sample.length ? Math.round(sample.reduce((s, e) => s + e.damnificados, 0) / sample.length) : 0,
      sampleSize: sample.length,
      extrapolated,
      centroid: centroid(list),
    });
  }

  districts.sort(
    (a, b) =>
      SEVERITY_WEIGHT[b.expectedSeverity] - SEVERITY_WEIGHT[a.expectedSeverity] ||
      b.probabilities.RED - a.probabilities.RED,
  );
  return { windowMm, districts };
}
