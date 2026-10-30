import type { BBox } from './index';

const EARTH_RADIUS_M = 6_371_008.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Distancia en metros por fórmula de Haversine (error < 0.5 % a escala urbana). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Geohash estándar. Precisión 5 ≈ celdas de 4.9 km × 4.9 km; precisión 4 ≈ 39 km × 19.5 km. */
export function geohashEncode(lat: number, lng: number, precision: number): string {
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  let hash = '';
  let bit = 0, ch = 0, evenBit = true;
  while (hash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { ch = (ch << 1) | 1; lngMin = mid; } else { ch <<= 1; lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { ch = (ch << 1) | 1; latMin = mid; } else { ch <<= 1; latMax = mid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}

function cellSize(precision: number): { dLat: number; dLng: number } {
  const bits = precision * 5;
  const lngBits = Math.ceil(bits / 2);
  const latBits = Math.floor(bits / 2);
  return { dLat: 180 / 2 ** latBits, dLng: 360 / 2 ** lngBits };
}

/**
 * Celdas geohash que cubren un bbox. Devuelve null si superan maxCells,
 * para que el llamador baje de precisión (vista muy alejada).
 */
export function geohashCellsForBBox(bbox: BBox, precision: number, maxCells = 64): string[] | null {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const { dLat, dLng } = cellSize(precision);
  const rows = Math.ceil((maxLat - minLat) / dLat) + 1;
  const cols = Math.ceil((maxLng - minLng) / dLng) + 1;
  if (rows * cols > maxCells) return null;

  const cells = new Set<string>();
  for (let lat = minLat; lat <= maxLat + dLat; lat += dLat) {
    for (let lng = minLng; lng <= maxLng + dLng; lng += dLng) {
      cells.add(geohashEncode(Math.min(lat, maxLat), Math.min(lng, maxLng), precision));
    }
  }
  return [...cells];
}

/** Precisiones usadas para salas de tiempo real: fina (zoom de calle) y gruesa (zoom regional). */
export const REALTIME_CELL_PRECISIONS = [5, 4] as const;

export function realtimeCellsForPoint(p: LatLng): string[] {
  return REALTIME_CELL_PRECISIONS.map((precision) => geohashEncode(p.lat, p.lng, precision));
}

/** Bounding box aproximado del departamento de Piura (para validar coordenadas y generar datos de prueba). */
export const PIURA_BBOX: BBox = [-81.45, -6.4, -79.1, -4.05];

export function isInsideBBox(p: LatLng, [minLng, minLat, maxLng, maxLat]: BBox): boolean {
  return p.lng >= minLng && p.lng <= maxLng && p.lat >= minLat && p.lat <= maxLat;
}
