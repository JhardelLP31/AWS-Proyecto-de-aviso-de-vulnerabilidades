import type { IncidentStatus, IncidentType, Severity } from '@geoalert/contracts';
import type { NewIncident } from '../domain/incident';

/**
 * Registro tal como viene del export INDECI / GeoSINPAD.
 * ⚠ Los nombres de columna son SUPUESTOS: ajústalos al archivo real (CSV/XLSX → JSON).
 */
export interface IndeciRecord {
  codigo: string;
  fecha: string; // ISO o dd/mm/yyyy
  fenomeno: string;
  descripcion?: string;
  distrito?: string;
  latitud: number | string;
  longitud: number | string;
  nivel?: string;
  estado?: string;
}

const TYPE_RULES: Array<[RegExp, IncidentType]> = [
  [/dique|defensa ribere/i, 'DIKE_BREACH'],
  [/cuenca ciega|dren|colector|colaps/i, 'BLIND_BASIN_COLLAPSE'],
  [/aislad|incomunic/i, 'ISOLATED_AREA'],
  [/huaico|desliz|derrumbe/i, 'LANDSLIDE'],
  [/v[ií]a|carretera|puente|tr[aá]nsito/i, 'FLOODED_ROAD'],
  [/desborde|inundaci|crecida|r[ií]o/i, 'RIVER_OVERFLOW'],
];

const SEVERITY_RULES: Array<[RegExp, Severity]> = [
  [/muy alto|rojo|4|emergencia/i, 'RED'],
  [/alto|naranja|3/i, 'ORANGE'],
  [/medio|moderado|amarillo|2/i, 'YELLOW'],
  [/bajo|verde|1/i, 'GREEN'],
];

function parseDate(raw: string): Date {
  const dmY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw);
  const date = dmY ? new Date(Date.UTC(+dmY[3], +dmY[2] - 1, +dmY[1], 12)) : new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(`Fecha inválida: ${raw}`);
  return date;
}

export function mapIndeciRecord(r: IndeciRecord): NewIncident & { status: IncidentStatus } {
  const lat = Number(r.latitud);
  const lng = Number(r.longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error(`Coordenadas inválidas en ${r.codigo}`);

  const text = `${r.fenomeno} ${r.descripcion ?? ''}`;
  const type = TYPE_RULES.find(([re]) => re.test(text))?.[1] ?? 'OTHER';
  const severity = SEVERITY_RULES.find(([re]) => re.test(r.nivel ?? ''))?.[1] ?? 'YELLOW';
  const status: IncidentStatus = /atendid|cerrad|resuelt/i.test(r.estado ?? '') ? 'RESOLVED' : 'VERIFIED';

  return {
    type,
    severity,
    status, // datos oficiales: nacen verificados (o resueltos)
    title: r.fenomeno.slice(0, 120),
    description: (r.descripcion ?? r.fenomeno).slice(0, 2000),
    lat,
    lng,
    district: r.distrito?.trim() || null,
    source: 'INDECI_IMPORT',
    externalRef: `INDECI:${r.codigo}`,
    reporterId: null,
    occurredAt: parseDate(r.fecha),
    photos: [],
  };
}
