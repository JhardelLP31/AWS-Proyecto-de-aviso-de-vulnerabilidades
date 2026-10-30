import L from 'leaflet';
import { leafletLayer } from 'protomaps-leaflet';
import { env, type BasemapProvider } from '../config/env';

/**
 * Proveedor de capa de mapa base 100% autónomo y local (Regla Tarea 03).
 * No realiza ninguna petición a servidores externos (sin OSM, sin OpenFreeMap, sin CARTO).
 */
export function createBasemapLayer(provider: BasemapProvider = env.basemap): L.Layer {
  if (provider === 'pmtiles') {
    try {
      // Protomaps vectorial autoalojado localmente desde /tiles/piura.pmtiles
      return leafletLayer({
        url: env.pmtilesUrl,
        flavor: 'dark',
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · Protomaps',
      }) as unknown as L.Layer;
    } catch (err: unknown) {
      console.warn('[Basemap] Error instanciando PMTiles local, usando capa base neutra:', err);
      return createNeutralLocalLayer();
    }
  }

  return createNeutralLocalLayer();
}

/**
 * Capa de respaldo neutra 100% local (none): dibuja el contorno de Piura
 * sobre fondo oscuro sin requerir archivos de teselas ni acceso a la red.
 */
function createNeutralLocalLayer(): L.Layer {
  const group = L.layerGroup();

  // Polígono simplificado del departamento de Piura (BBox [-81.45, -6.40, -79.10, -4.05])
  const piuraCoords: [number, number][] = [
    [-4.05, -81.45],
    [-4.05, -80.25],
    [-4.85, -79.10],
    [-5.85, -79.10],
    [-6.40, -80.10],
    [-6.40, -80.95],
    [-5.50, -81.45],
    [-4.05, -81.45],
  ];

  const polygon = L.polygon(piuraCoords, {
    color: '#38bdf8',
    weight: 2,
    opacity: 0.6,
    fillColor: '#0c1527',
    fillOpacity: 0.85,
    dashArray: '4, 4',
  });

  polygon.bindTooltip('Región Piura (Cobertura Local FEN)', {
    permanent: true,
    direction: 'center',
    className: 'piura-boundary-tooltip',
  });

  group.addLayer(polygon);
  return group;
}
