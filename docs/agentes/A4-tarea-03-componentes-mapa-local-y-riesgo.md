# A4 · Tarea 03 — Componentes, mapa 100 % local y capa de riesgo histórico

> **Para**: Antigravity (A4 · Frontend Vue 3)
> **De**: A0 (Claude), a pedido de Jhar · 2026-10-30
> **Prioridad**: alta · **Rama**: `dev`
> **Relación con la tarea 02**: termina y sube primero lo que tienes de la tarea 02. Esta tarea **cambia una decisión**
> de la 02: los proveedores externos (`osm`, `openfreemap`) dejan de estar permitidos (ver §1).
> Al empezar, añádela a *Solicitudes recibidas* de tu avance y márcala al terminar.

## 1. Regla nueva: la app no consume servicios externos en tiempo de ejecución

Jhar confirmó que **no se pueden consumir servicios externos**. Desde ahora, al abrir la app en el navegador,
**todas** las peticiones van a nuestro propio origen (`localhost:5173` / `localhost:3000` en desarrollo; nuestro dominio
en `stg`/`prod`). Esto incluye mapas, fuentes, CSS y scripts.

Hoy se incumple en estos puntos (revisado en `dev`):

| Dónde | Qué carga de fuera | Cómo arreglarlo |
|---|---|---|
| `index.html` | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Paquete `@fontsource/<fuente>` importado en `main.ts`, o la fuente del sistema |
| `index.html` | CSS de Leaflet y markercluster desde `unpkg.com` | `import 'leaflet/dist/leaflet.css'` y los CSS de `leaflet.markercluster` desde `node_modules` |
| `shared/map/basemap.ts` (tu trabajo local de la tarea 02) | `osm` y `openfreemap` como opción y como respaldo | Quitar ambos proveedores (ver T03-1) |

Descargar algo **una vez al preparar el entorno** (por ejemplo, el recorte PMTiles) sí está permitido, pero el
resultado se **versiona en el repo** para que la demo no dependa de esa descarga.

## 2. Qué hacer

### T03-1 · Mapa base solo local (obligatorio)

1. `basemap.ts` ofrece solo `pmtiles` (por defecto) y `none`, un fondo neutro con la silueta de Piura (ver punto 4), útil
   si el archivo aún no existe. **Sin respaldo automático a ningún servidor externo.**
2. Genera el recorte con tu `scripts/fetch-basemap.mjs` (bbox `PIURA_BBOX`, `--maxzoom=14`) y **súbelo a git** en
   `apps/web/public/tiles/piura.pmtiles`: quita `*.pmtiles` del `.gitignore` para ese archivo. Si pesa más de 50 MB,
   baja a `--maxzoom=13`. Anota el tamaño final en tu avance.
3. La atribución `© OpenStreetMap contributors · Protomaps` sigue siendo obligatoria: es un requisito de la licencia de los
   datos, no un servicio externo.
4. Fondo `none`: un `L.geoJSON` con el contorno de la región, en `public/geo/piura-limite.geojson`, sobre fondo liso.
   Si no consigues un contorno con licencia libre, usa un rectángulo con `PIURA_BBOX`.
5. Criterio: con la pestaña Red del navegador abierta, ninguna petición sale de `localhost`. Pruébalo también con el
   Wi-Fi desconectado (API y web en local): el mapa tiene que verse.

### T03-2 · Separar en componentes (obligatorio)

Hoy `shared/ui/` solo tiene `styles.css` y las vistas pasan de 350–520 líneas, con lógica repetida. Objetivo: **ninguna
vista supera ~200 líneas** y lo repetido vive en un solo componente.

Componentes base en `shared/ui/` (genéricos, sin conocer el dominio):

| Componente | Sustituye a |
|---|---|
| `BaseButton.vue` (variantes `primary`, `danger`, `ghost`; estado `loading`) | los `<button>` con estilos sueltos de todas las vistas |
| `BaseSelect.vue`, `BaseField.vue` (label + error) | los `<select>`/`<input>` de `ReportIncidentView` y `LoginView` |
| `AppToast.vue` + `useToast.ts` | los `alert(...)` de `IncidentPopup.vue` y `DispatchDashboard.vue` |
| `BaseModal.vue` (confirmaciones) | confirmaciones con `alert`/`confirm` |
| `StatusBanner.vue` | avisos de GPS denegado, socket desconectado, modo demo |

Componentes de dominio en cada `features/<x>/components/`:

| Feature | Componentes |
|---|---|
| `map` | `MapCanvas.vue` (solo crea el mapa y expone la instancia), `IncidentMarkersLayer.vue`, `RiskHeatLayer.vue` (T03-3), `LocateMeButton.vue`, `SocketStatusBadge.vue`, `MapLayerToggle.vue` |
| `report` | `IncidentTypeSelect.vue`, `SeveritySelect.vue`, `PhotoCapture.vue` (usa `useCameraWebp`), `LocationPicker.vue` |
| `dispatch` | `DispatchFilters.vue`, `IncidentQueueTable.vue`, `TriageActions.vue` |
| `auth` | `DemoProfiles.vue` (solo en modo demo) |

Reglas:

1. Las **opciones** de tipo y severidad salen de `@geoalert/contracts` (`INCIDENT_TYPES`, severidades) más un mapa de
   etiquetas e iconos en `shared/config/labels.ts`. Hoy están escritas a mano en `ReportIncidentView.vue` y en
   `DispatchDashboard.vue` (`['ALL','RED',…]`).
2. Colores y textos de severidad: una sola fuente, `shared/map/severity-style.ts` (hoy siguen en `DisasterMap.vue`
   y `IncidentPopup.vue`).
3. Nada de `any`: hay `err: any` en `LoginView`, `IncidentPopup` y `ReportIncidentView`, y `(marker as any)` en
   `DisasterMap`. Usa `ApiError` de contratos y una subclase tipada de marcador.
4. Props tipadas con `defineProps<…>()` y eventos con `defineEmits<…>()`. Los componentes de `shared/ui` no importan stores.

### T03-3 · Bug: el triaje del despacho no llega a la API (obligatorio)

`DispatchDashboard.vue` → `updateTriageStatus()` cambia `incident.status` **solo en memoria**
(`incident.status = newStatus as any`), y `dispatchTeam()` es un `alert`. Al recargar, el cambio desaparece y los
demás usuarios nunca lo ven.

- El triaje llama a `PATCH /api/incidents/:id/triage` (tipo `TriageRequest`, con `expectedVersion`) desde
  `incident.store.ts`, y el estado se actualiza con la respuesta o con el evento del socket.
- `STALE_VERSION` (409) → toast "Otro operador actualizó este incidente" y recarga del incidente.
- "Despachar brigada" queda deshabilitado con el texto "Próximamente" hasta que exista el endpoint (F3).

### T03-4 · Capa de riesgo histórico y predicción (cuando A3 publique los endpoints)

Jhar añadió datos guía en `data/indeci_historico_piura.{csv,json}`: 5 000 emergencias SINPAD de Piura (2010–2023),
7 distritos, con precipitación, vulnerabilidad del suelo, severidad, damnificados y coordenadas.
**El frontend no lee esos archivos**: A3 los carga en la API y expone (contrato provisional, se fija en
`docs/contratos.md`):

| Endpoint | Devuelve | Uso en el front |
|---|---|---|
| `GET /api/risk/heatmap?bbox=` | celdas `{ lat, lng, weight }` | `RiskHeatLayer.vue` con `leaflet.heat` (npm, sin CDN) |
| `GET /api/risk/districts` | ranking por distrito: eventos, % críticos, damnificados, vulnerabilidad | `features/risk/RiskDistrictsPanel.vue` |
| `GET /api/risk/forecast?precipitationMm=` | severidad esperada por distrito para esa lluvia | `features/risk/RiskForecastView.vue` con un control deslizante de mm de lluvia |

Requisitos de interfaz:

- Capa "Riesgo histórico" apagada por defecto, activable en `MapLayerToggle.vue`.
- La vista de predicción muestra siempre la leyenda **"Estimación basada en datos históricos de referencia; no es un
  pronóstico oficial"**. Los datos son de guía: no se presentan como modelo entrenado.
- Ruta `/riesgo`, protegida por el permiso `analytics.read`.

Hasta que existan los endpoints, trabaja T03-1 a T03-3; A0 avisará en tu avance cuando T03-4 esté desbloqueada.

## 3. Criterios de aceptación (los valida A0)

- [ ] Cero peticiones fuera de `localhost` con la app abierta (pestaña Red), incluidas fuentes y CSS.
- [ ] Mapa visible con el Wi-Fi apagado; `piura.pmtiles` versionado; atribución OSM visible.
- [ ] `index.html` sin `unpkg.com` ni `fonts.googleapis.com`.
- [ ] Ninguna vista supera ~200 líneas; no queda ningún `alert(`; no queda ningún `any`.
- [ ] Tipos y severidades salen de contratos; colores de severidad en un único archivo.
- [ ] El triaje persiste tras recargar y se ve en otro navegador.
- [ ] (T03-4) Capa de calor y vista de predicción con la leyenda de datos de referencia.
- [ ] `vue-tsc --noEmit` y `pnpm --filter <web> build` pasan.
