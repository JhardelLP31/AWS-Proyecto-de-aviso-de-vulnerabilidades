# A4 · Tarea 02 — Mapa base sin claves, registro y estructura del frontend

> **Para**: Antigravity (A4 · Frontend Vue 3)
> **De**: A0 (Claude), a pedido de Jhar · 2026-10-30
> **⚠ Actualizada por la [tarea 03](A4-tarea-03-componentes-mapa-local-y-riesgo.md)**: no se permiten servicios
> externos, así que `osm` y `openfreemap` ya no son opciones válidas. El resto de esta tarea sigue vigente.
> **Prioridad**: alta (bloquea la demo) · **Rama**: `dev`
> Sustituye a `docs/propuestas/PROPUESTA-Coordinador-a-A4-mapa-base-y-estructura-frontend.md` (borrador local, no subido).
> Al empezar, añade esta tarea a *Solicitudes recibidas* de tu avance y márcala al terminar.

## 1. Problema

El mapa sale con la marca de agua **"API KEY REQUIRED · carto.com/basemaps/apikey"** en todas las teselas.
CARTO ahora exige una clave de API para sus basemaps (`basemaps.cartocdn.com/rastertiles/voyager`);
ver [carto.com/basemaps/apikey](https://www.carto.com/basemaps/apikey/). Los marcadores y clústeres
funcionan: solo falla el **fondo**.

Además, la consola muestra `[LocationStore] Error de GPS: User denied Geolocation` sin que la interfaz lo explique.

> **Validado por A0 sobre `dev` (commit 5c353b6)**: el build (`vue-tsc` + `vite build`) pasa; el login con
> `coer@demo.pe` funciona, la sesión se restaura al recargar (`/auth/csrf` + `/auth/me` → 200) y `/dispatch`
> respeta el permiso `alerts.receive`. La vista `/login` "vacía" que se vio en el equipo de Jhar era una captura en mitad
> de la animación de cambio de página: el login funciona también allí.

## 2. Decisión: el mapa base no depende de servicios externos con clave

No sabemos si las reglas del hackathon limitan el uso de APIs externas (**Jhar lo confirma con la organización**).
Para no depender de esa respuesta, el diseño cumple con ambas: **el mapa base se autoaloja** y los proveedores
externos sin clave quedan solo como alternativa configurable. Además, en una emergencia real la conectividad
falla: un mapa que vive en nuestro propio dominio (y en la caché del service worker) sigue funcionando.

| Opción | Clave | Externo | Offline | Uso |
|---|---|---|---|---|
| **A. PMTiles de Piura autoalojado** (Protomaps) | No | No | Sí (con service worker) | **Producción y demo** |
| B. OpenFreeMap (teselas vectoriales OSM) | No | Sí | No | Desarrollo rápido / respaldo |
| C. OpenStreetMap raster (`tile.openstreetmap.org`) | No | Sí | No | Solo respaldo de emergencia; su política de uso prohíbe tráfico intenso |
| ~~CARTO~~ | Sí | Sí | No | **Descartado** |

Referencias: [protomaps-leaflet](https://github.com/protomaps/protomaps-leaflet),
[ejemplo de autoalojamiento de PMTiles](https://supabase.com/blog/self-host-maps-storage-protomaps),
[OpenFreeMap](https://openfreemap.org).

## 3. Qué hacer

### T02-1 · Capa de mapa base configurable (obligatorio)

**Orden de entrega**: primero `osm` como valor por defecto (arregla el mapa hoy, en minutos); cuando T02-2 tenga el
archivo de Piura, el valor por defecto pasa a `pmtiles`. Ambos quedan disponibles por variable de entorno.

1. Crear `src/shared/map/basemap.ts` como **único lugar** que sabe de proveedores de teselas:
   ```ts
   export type BasemapProvider = 'pmtiles' | 'openfreemap' | 'osm';
   export function createBasemapLayer(provider = import.meta.env.VITE_BASEMAP as BasemapProvider): L.Layer
   ```
   `DisasterMap.vue` solo llama a `createBasemapLayer()`; no contiene URLs de teselas.
2. Proveedor `pmtiles` (por defecto): `protomaps-leaflet` leyendo `VITE_BASEMAP_PMTILES_URL`
   (en desarrollo `/tiles/piura.pmtiles`; en producción la URL de CloudFront que dará A5).
3. Proveedor `openfreemap`: si se mantiene Leaflet, mediante `@maplibre/maplibre-gl-leaflet` con el estilo
   `https://tiles.openfreemap.org/styles/liberty`. Si eliges migrar a MapLibre GL, hazlo en una tarea aparte (ver §5).
4. Proveedor `osm`: `L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })`.
5. **Atribución obligatoria** en todos: `© OpenStreetMap contributors` (y `Protomaps` u `OpenFreeMap` según el caso).
6. Documentar `VITE_BASEMAP` y `VITE_BASEMAP_PMTILES_URL` en `apps/web/.env.example`.
7. Eliminar toda referencia a `cartocdn.com`.

### T02-2 · Generar el PMTiles de Piura (obligatorio)

- Script `apps/web/scripts/fetch-basemap.mjs` que descargue el recorte con la CLI `pmtiles`:
  ```bash
  pmtiles extract https://build.protomaps.com/<AAAAMMDD>.pmtiles public/tiles/piura.pmtiles \
    --bbox=-81.45,-6.40,-79.10,-4.05 --maxzoom=15
  ```
  (el bbox es `PIURA_BBOX` de `@geoalert/contracts`; usa una fecha de build vigente).
- **No subir el `.pmtiles` a git**: añadir `apps/web/public/tiles/*.pmtiles` a `.gitignore` y anotar en el README
  de `apps/web` cómo generarlo. Si pesa más de ~60 MB, bajar `--maxzoom` a 14 y anotar el tamaño final en tu avance.
- Pedir a A5 (en tu avance) que lo publique en S3 + CloudFront para `stg`/`prod`.

### T02-3 · Login: corregir accesos rápidos, vista vacía y registro

1. **Credenciales de los accesos rápidos (bug)**: `LoginView.vue` rellena `vecino@piura.gob.pe / Vecino2026!`,
   `brigadista@indeci.gob.pe`, `coer@regionpiura.gob.pe` y `admin@geoalert.pe`, que **no existen en la API**.
   Usar los usuarios demo del contrato, moverlos a `shared/config/demo-profiles.ts` y mostrarlos solo si `import.meta.env.DEV` o `VITE_DEMO_MODE=true`.
   Usuarios: `vecino@demo.pe`, `brigadista@demo.pe`, `coer@demo.pe`, `admin@demo.pe`,
   todos con `GeoAlert2026!` (ver [contratos.md](../contratos.md)). Hoy los cuatro botones fallan con 401.
2. **Registro**: `RegisterView.vue` → `POST /api/auth/register` (tipo `RegisterRequest`), con los mensajes del
   backend para contraseña débil (400) y correo repetido (`EMAIL_ALREADY_REGISTERED`, 409).
3. Mensajes por código: 401 → "Correo o contraseña incorrectos"; 429 → "Demasiados intentos, espera un minuto".

### T02-4 · GPS denegado (obligatorio)

- Si el usuario niega la ubicación: centrar el mapa en Piura (`PIURA_BBOX`), mostrar un aviso no bloqueante
  ("Activa tu ubicación para confirmar peligros cercanos") y **deshabilitar** los botones de voto, no ocultarlos.
- Nunca dejar el error solo en la consola.

## 4. Estructura del frontend (obligatoria a partir de esta tarea)

```
apps/web/src/
├── app/                  main.ts, App.vue, router.ts (rutas + guards por meta.permissions)
├── shared/
│   ├── api/              http.ts (fetch + credentials + X-CSRF-Token + errores tipados), endpoints por recurso
│   ├── map/              basemap.ts, severity-style.ts (colores semafóricos), cluster.ts
│   ├── ui/               componentes genéricos (Button, Toast, Modal, Spinner)
│   └── config/           env.ts (lee y valida import.meta.env en un solo lugar)
├── stores/               auth.store.ts, incident.store.ts, location.store.ts
├── composables/          useCameraWebp.ts, usePermissions.ts, useGeolocation.ts, useIncidentsSocket.ts
├── directives/           v-can.ts
└── features/
    ├── auth/             LoginView.vue, RegisterView.vue
    ├── map/              DisasterMap.vue, IncidentPopup.vue, SeverityLegend.vue
    ├── report/           ReportIncidentView.vue
    └── dispatch/         DispatchDashboard.vue
```

Estado actual frente a esta estructura: ya existen `app/`, `shared/api`, `shared/ui`, `stores/`, `composables/`,
`directives/` y `features/{auth,map,report,dispatch}`. **Faltan** `shared/map/` (sacar de `DisasterMap.vue` la capa base
y los colores de severidad: hoy están repetidos en tres lugares; dejar una sola fuente en `shared/map/severity-style.ts`), `shared/config/env.ts`, `composables/useGeolocation.ts` y `features/auth/RegisterView.vue`.

Reglas:
1. Los componentes **no llaman a `fetch`**: usan stores, y los stores usan `shared/api`.
2. Todos los tipos de la API vienen de `@geoalert/contracts`. Nada de redefinir `IncidentDTO` en el front.
3. Ninguna URL externa ni clave fuera de `shared/config/env.ts` y `.env.example` (hoy `apps/web` no tiene `.env.example`: crearlo).
4. Los errores se muestran según `code` (`GEOFENCE_VIOLATION`, `STALE_VERSION`, etc.), no según el texto.
5. `<script setup lang="ts">` en todos los componentes; TypeScript estricto, sin `any`.
6. `pnpm --filter <web> build` y `vue-tsc --noEmit` deben pasar antes de subir.

## 5. Fuera de alcance de esta tarea

- Migrar de Leaflet a MapLibre GL (posible mejora en F2: clustering nativo y estilos vectoriales; se decide aparte).
- PWA / caché offline del `.pmtiles` (F4, tarea A4-F4-01).

## 6. Criterios de aceptación (los valida A0)

- [ ] Ninguna marca de agua en el mapa; cero peticiones a `cartocdn.com` (pestaña Red del navegador).
- [ ] Con `VITE_BASEMAP=pmtiles` el mapa base carga **sin ninguna petición fuera de `localhost`**.
- [ ] Cambiar `VITE_BASEMAP` a `openfreemap` u `osm` funciona sin tocar código.
- [ ] Atribución de OpenStreetMap visible.
- [x] Login con `coer@demo.pe` funciona; recargar la página mantiene la sesión (validado en 5c353b6).
- [ ] Los 4 accesos rápidos inician sesión contra la API.
- [ ] Registro funcional con mensajes de error por código.
- [ ] Con el GPS denegado aparece el aviso y los votos quedan deshabilitados.
- [ ] La estructura de `src/` sigue el §4 y el build pasa.
- [x] `apps/web` subido a `dev` (commit 5c353b6).
