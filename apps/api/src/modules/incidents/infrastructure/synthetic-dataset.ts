import { INCIDENT_TYPES } from '@geoalert/contracts';
import type { IndeciRecord } from './indeci.mapper';

/**
 * Generador DETERMINISTA (semilla fija) de una matriz tipo INDECI para Piura.
 * Se usa mientras no tengas el export real: mismo resultado en cada arranque,
 * por lo que demos y tests son reproducibles.
 */
const HOTSPOTS: Array<{ district: string; lat: number; lng: number; spreadKm: number; weight: number }> = [
  { district: 'Piura', lat: -5.1945, lng: -80.6328, spreadKm: 4, weight: 18 },
  { district: 'Castilla', lat: -5.1961, lng: -80.6175, spreadKm: 4, weight: 15 },
  { district: 'Veintiséis de Octubre', lat: -5.1830, lng: -80.6650, spreadKm: 3, weight: 12 },
  { district: 'Catacaos', lat: -5.2670, lng: -80.6760, spreadKm: 5, weight: 12 },
  { district: 'Cura Mori', lat: -5.3230, lng: -80.6650, spreadKm: 4, weight: 6 },
  { district: 'La Arena', lat: -5.3450, lng: -80.7080, spreadKm: 4, weight: 6 },
  { district: 'Sullana', lat: -4.9039, lng: -80.6853, spreadKm: 5, weight: 9 },
  { district: 'Tambogrande', lat: -4.9270, lng: -80.3410, spreadKm: 6, weight: 6 },
  { district: 'Chulucanas', lat: -5.0930, lng: -80.1630, spreadKm: 5, weight: 6 },
  { district: 'Sechura', lat: -5.5570, lng: -80.8220, spreadKm: 6, weight: 5 },
  { district: 'Paita', lat: -5.0890, lng: -81.1140, spreadKm: 4, weight: 3 },
  { district: 'Talara', lat: -4.5770, lng: -81.2720, spreadKm: 4, weight: 2 },
];

const FENOMENO: Record<(typeof INCIDENT_TYPES)[number], string[]> = {
  RIVER_OVERFLOW: ['Desborde del río Piura', 'Inundación por crecida del río', 'Desborde de quebrada'],
  BLIND_BASIN_COLLAPSE: ['Colapso de cuenca ciega', 'Dren colmatado en cuenca ciega', 'Colector colapsado'],
  DIKE_BREACH: ['Rotura de dique', 'Filtración en defensa ribereña', 'Socavamiento de dique'],
  ISOLATED_AREA: ['Caserío aislado por inundación', 'Centro poblado incomunicado'],
  FLOODED_ROAD: ['Vía inundada', 'Puente colapsado', 'Carretera intransitable'],
  LANDSLIDE: ['Huaico', 'Deslizamiento de tierra'],
  OTHER: ['Vivienda colapsada por lluvias', 'Afloramiento de aguas servidas'],
};

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticIndeci(count = 5_000, seed = 2017): IndeciRecord[] {
  const rand = mulberry32(seed);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const totalWeight = HOTSPOTS.reduce((s, h) => s + h.weight, 0);
  // Eventos históricos: Niño Costero 2017 (ene–abr) y ciclón Yaku 2023 (mar–abr).
  const seasons = [
    { from: Date.UTC(2017, 0, 15), to: Date.UTC(2017, 3, 30) },
    { from: Date.UTC(2023, 2, 1), to: Date.UTC(2023, 3, 30) },
  ];

  return Array.from({ length: count }, (_, i) => {
    let r = rand() * totalWeight;
    const spot = HOTSPOTS.find((h) => (r -= h.weight) < 0) ?? HOTSPOTS[0];
    // Dispersión gaussiana (Box–Muller) alrededor del núcleo urbano.
    const g = Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
    const h = Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.sin(2 * Math.PI * rand());
    const km = 1 / 111;
    const type = pick(INCIDENT_TYPES);
    const season = pick(seasons);
    const fecha = new Date(season.from + rand() * (season.to - season.from));
    const sevIdx = Math.min(3, Math.floor(rand() ** 0.7 * 4));
    return {
      codigo: `SINT-${String(i + 1).padStart(5, '0')}`,
      fecha: fecha.toISOString(),
      fenomeno: pick(FENOMENO[type]),
      descripcion: `Registro sintético #${i + 1} en ${spot.district}`,
      distrito: spot.district,
      latitud: +(spot.lat + g * spot.spreadKm * km * 0.5).toFixed(6),
      longitud: +(spot.lng + h * spot.spreadKm * km * 0.5).toFixed(6),
      nivel: ['bajo', 'medio', 'alto', 'muy alto'][sevIdx],
      estado: rand() < 0.96 ? 'atendido' : 'en evaluación',
    };
  });
}
