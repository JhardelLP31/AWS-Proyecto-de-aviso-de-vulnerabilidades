# @geoalert/web — Frontend Vue 3 (GeoAlert / ResQMap)

SPA en tiempo real para reporte ciudadano, monitoreo y despacho ante el Fenómeno El Niño (Piura, Perú).

## Variables de Entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_BASEMAP` | Proveedor del mapa base (`osm`, `pmtiles`, `openfreemap`) | `osm` |
| `VITE_BASEMAP_PMTILES_URL` | Ruta o URL al archivo `.pmtiles` de Piura | `/tiles/piura.pmtiles` |
| `VITE_DEMO_MODE` | Mostrar botones de login rápido para evaluación | `true` |
| `VITE_API_URL` | Endpoint base del backend | `/api` |

## Mapa Base Autoalojado (PMTiles)

Para operar de forma 100% autónoma y offline sin depender de servicios externos:

1. Ejecuta el script de recorte:
   ```bash
   node scripts/fetch-basemap.mjs
   ```
2. O ejecuta manualmente con la CLI de `pmtiles`:
   ```bash
   pmtiles extract https://build.protomaps.com/20240901.pmtiles public/tiles/piura.pmtiles \
     --bbox=-81.45,-6.40,-79.10,-4.05 --maxzoom=14
   ```
3. En `.env`, configura:
   ```env
   VITE_BASEMAP=pmtiles
   ```

El archivo `.pmtiles` está ignorado en git por peso.

## Desarrollo

```bash
pnpm dev
```

La app corre en `http://localhost:5173` y redirige `/api` y `/socket.io` a `localhost:3000`.

## Pruebas y Compilación

```bash
pnpm typecheck
pnpm test
pnpm build
```
