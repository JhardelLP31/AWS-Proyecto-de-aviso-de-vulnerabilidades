import type { Severity } from '@geoalert/contracts';

/** Evento histórico ya normalizado (sin depender del formato del archivo de origen). */
export interface HistoricalEvent {
  id: string;
  district: string;
  date: string; // YYYY-MM-DD
  hazard: string;
  precipitationMm: number;
  soilVulnerability: number;
  severity: Severity;
  damnificados: number;
  afectados: number;
  viviendasColapsadas: number;
  lat: number;
  lng: number;
}

/** Fila tal como viene en data/indeci_historico_piura.json (formato SINPAD). */
export interface SinpadRow {
  ID_EMERGENCIA: string;
  DISTRITO: string;
  FECHA_EVENTO: string;
  TIPO_PELIGRO: string;
  PRECIPITACION_MM: number | string;
  VULNERABILIDAD_SUELO: number | string;
  NIVEL_SEVERIDAD: string;
  TOTAL_DAMNIFICADOS: number | string;
  TOTAL_AFECTADOS: number | string;
  VIVIENDAS_COLAPSADAS: number | string;
  lat: number | string;
  lng: number | string;
}

const SEVERITY_FROM_SINPAD: Record<string, Severity> = {
  BAJA: 'GREEN',
  MEDIA: 'YELLOW',
  ALTA: 'ORANGE',
  CRITICA: 'RED',
  CRÍTICA: 'RED',
};

const titleCase = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase());

/** Convierte una fila SINPAD; devuelve null si la fila no es utilizable (se descarta, no aborta la carga). */
export function fromSinpadRow(row: SinpadRow): HistoricalEvent | null {
  const severity = SEVERITY_FROM_SINPAD[String(row.NIVEL_SEVERIDAD ?? '').trim().toUpperCase()];
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  const precipitationMm = Number(row.PRECIPITACION_MM);
  if (!severity || !Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(precipitationMm)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.FECHA_EVENTO))) return null;
  return {
    id: String(row.ID_EMERGENCIA),
    district: titleCase(String(row.DISTRITO)),
    date: String(row.FECHA_EVENTO),
    hazard: String(row.TIPO_PELIGRO).trim().toUpperCase(),
    precipitationMm,
    soilVulnerability: Number(row.VULNERABILIDAD_SUELO) || 0,
    severity,
    damnificados: Number(row.TOTAL_DAMNIFICADOS) || 0,
    afectados: Number(row.TOTAL_AFECTADOS) || 0,
    viviendasColapsadas: Number(row.VIVIENDAS_COLAPSADAS) || 0,
    lat,
    lng,
  };
}
