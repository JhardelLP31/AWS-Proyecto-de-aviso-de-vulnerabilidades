# A4 · Frontend Vue 3

> **Tareas asignadas pendientes** (en orden):
> 1. [Tarea 02 · Mapa base sin claves, registro y estructura](A4-tarea-02-mapa-base-y-estructura.md)
> 2. [Tarea 03 · Componentes, mapa 100 % local y riesgo histórico](A4-tarea-03-componentes-mapa-local-y-riesgo.md)
>
> **Regla**: la app no consume servicios externos en tiempo de ejecución (mapas, fuentes, CDNs). El mapa base es el
> PMTiles de Piura versionado en el repo; OSM, OpenFreeMap y CARTO quedan descartados.

## Misión
La SPA que usan vecinos, brigadistas y Defensa Civil: mapa en vivo estilo Waze, reporte con foto WebP,
confirmación con un toque y panel de despacho.

## Es dueño de
- `apps/web/` completo

## No toca
Backend, contratos (pide cambios a A0), infraestructura.

## Stack obligatorio
Vue 3 con `<script setup lang="ts">`, Pinia (`useAuthStore`, `useIncidentStore`, `useLocationStore`),
Vue Router 4 con guards por permiso, Leaflet + `leaflet.markercluster` (o MapLibre), `socket.io-client`,
tipos solo desde `@geoalert/contracts`. Nunca guardar tokens en `localStorage`: la sesión va en cookie HttpOnly;
el token CSRF vive solo en memoria y se recupera con `GET /api/auth/csrf` tras recargar.

## Estructura
```
apps/web/src/
├── app/            main.ts, router.ts, App.vue
├── shared/         api/http.ts (fetch con credentials + X-CSRF-Token), ui/
├── composables/    useCameraWebp.ts, usePermissions.ts, useGeolocation.ts, useIncidentsSocket.ts
├── directives/     v-can.ts
├── stores/         auth.store.ts, incident.store.ts, location.store.ts
└── features/
    ├── auth/       LoginView.vue
    ├── map/        DisasterMap.vue, IncidentPopup.vue, SeverityLegend.vue
    ├── report/     ReportIncidentView.vue
    └── dispatch/   DispatchDashboard.vue
```

## Tareas

### F1
- [ ] A4-F1-01 Scaffold Vite + Vue 3 + TS estricto + Pinia + Router; proxy `/api` y `/socket.io` a `localhost:3000`
- [ ] A4-F1-02 `shared/api/http.ts`: `credentials: 'include'`, cabecera CSRF, manejo de 401/403/422 tipado
- [ ] A4-F1-03 `useAuthStore` (login, logout, me, permisos) y `LoginView.vue`
- [ ] A4-F1-04 `usePermissions.ts` con `can()` / `canAny()` y directiva `v-can="'incidents.verify'"` (oculta o deshabilita con `.disable`)
- [ ] A4-F1-05 Guards de ruta con `meta.permissions`

### F2
- [ ] A4-F2-01 `useCameraWebp.ts`: `getUserMedia` o `<input capture>`, `createImageBitmap` (orientación EXIF), escalado ≤ 1280 px,
      `OffscreenCanvas.convertToBlob({ type: 'image/webp', quality: 0.75 })`, bajar calidad/escala hasta < 150 KB,
      respaldo JPEG si el navegador no codifica WebP
- [ ] A4-F2-02 `ReportIncidentView.vue`: tipo, severidad, descripción, ubicación GPS, hasta 3 fotos, envío multipart
- [ ] A4-F2-03 `DisasterMap.vue`: capas semafóricas (verde/amarillo/naranja/rojo), clustering con color de la peor severidad, carga por `bbox` en `moveend`

### F3
- [ ] A4-F3-01 `useIncidentsSocket.ts`: conexión con cookie, `viewport.subscribe` al mover el mapa, aplicar eventos al store
- [ ] A4-F3-02 `IncidentPopup.vue`: botón "Confirmar peligro en el lugar" / "Desmentir", habilitado solo a ≤ 500 m (Haversine de contratos)
- [ ] A4-F3-03 `DispatchDashboard.vue` (permiso `alerts.receive`): cola de verificados en vivo, triaje

### F4
- [ ] A4-F4-01 PWA: service worker, cola offline de reportes con reintento
- [ ] A4-F4-02 Panel de analítica (`analytics.read`)

## Definición de terminado
Funciona en Chrome Android y Safari iOS; ninguna foto supera 150 KB; Lighthouse móvil ≥ 85 en rendimiento.
