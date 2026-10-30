/**
 * Validación y acceso centralizado a variables de entorno de la SPA.
 * Regla Tarea 03: Ninguna URL ni servicio externo en tiempo de ejecución.
 */

export type BasemapProvider = 'pmtiles' | 'none';

export interface AppEnv {
  basemap: BasemapProvider;
  pmtilesUrl: string;
  isDemoMode: boolean;
  apiUrl: string;
}

const rawBasemap = (import.meta.env.VITE_BASEMAP || 'pmtiles').toLowerCase();
const basemap: BasemapProvider = rawBasemap === 'none' ? 'none' : 'pmtiles';

export const env: AppEnv = {
  basemap,
  pmtilesUrl: import.meta.env.VITE_BASEMAP_PMTILES_URL || '/tiles/piura.pmtiles',
  isDemoMode: import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true',
  apiUrl: import.meta.env.VITE_API_URL || '/api',
};
