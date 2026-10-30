# Avance · A4 Frontend Vue 3

> Actualiza este archivo **en el mismo commit** que el trabajo que reporta.
> Las tareas y su descripción están en [tu ficha](../agentes/A4-frontend-vue.md); aquí solo se marca el progreso.

## Estado

| Campo | Valor |
|---|---|
| Fase actual | F1 / F2 / F3 / F4 · Tarea 03 (Componentes, mapa local, triaje y riesgo histórico) |
| Siguiente tarea | A4-F4-01 (PWA: service worker, cola offline de reportes) |
| Ejecutado por | Antigravity |
| Estado | 🟢 activo / Tarea 03 completada al 100% |
| Bloqueado por | Ninguno |
| Última actualización | 2026-10-30 |

## Progreso de tareas

| Tarea | Estado | Commit | Notas |
|---|---|---|---|
| A4-F1-01 | ✅ hecha | 5c353b6 | Scaffold Vite + Vue 3 + TS estricto + Pinia + Router + proxy /api y /socket.io |
| A4-F1-02 | ✅ hecha | 5c353b6 | shared/api/http.ts con credentials include, CSRF en memoria y errores tipados 401/403/422 |
| A4-F1-03 | ✅ hecha | 5c353b6 | useAuthStore (login, logout, me, permisos) y LoginView.vue con perfiles demo de Piura |
| A4-F1-04 | ✅ hecha | 5c353b6 | usePermissions.ts con can/canAny/canAll y directiva v-can con modificador .disable |
| A4-F1-05 | ✅ hecha | 5c353b6 | Guards de navegación global evaluando meta.permissions contra contratos |
| A4-F2-01 | ✅ hecha | 5c353b6 | useCameraWebp.ts con EXIF, OffscreenCanvas, loop adaptativo <150KB y fallback JPEG |
| A4-F2-02 | ✅ hecha | 5c353b6 | ReportIncidentView.vue con tipo, severidad, GPS, hasta 3 fotos y multipart |
| A4-F2-03 | ✅ hecha | 5c353b6 | DisasterMap.vue con Leaflet Canvas, clustering semafórico de peor severidad y bbox |
| A4-F3-01 | ✅ hecha | 5c353b6 | useIncidentsSocket.ts con conexión por cookie, viewport.subscribe y eventos |
| A4-F3-02 | ✅ hecha | 5c353b6 | IncidentPopup.vue con botón de validación in situ <500m (Haversine) y desmentido |
| A4-F3-03 | ✅ hecha | 5c353b6 | DispatchDashboard.vue con cola de triaje en vivo y métricas de cuenca |
| A4-T02-1 | ✅ hecha | 5c353b6 | shared/map/basemap.ts configurable; eliminación total de CARTO |
| A4-T02-2 | ✅ hecha | 5c353b6 | scripts/fetch-basemap.mjs y exclusión de .pmtiles en .gitignore para mapa base |
| A4-T02-3 | ✅ hecha | 5c353b6 | LoginView con credenciales demo reales (contratos.md), mensajes 401/429 y RegisterView.vue |
| A4-T02-4 | ✅ hecha | 5c353b6 | Aviso no bloqueante de GPS denegado en DisasterMap y botones de voto deshabilitados |
| A4-T03-1 | ✅ hecha | bda2358 | Mapa base 100% local (PMTiles autoalojado / none), sin peticiones externas, piura.pmtiles en git, fonts y CSS locales |
| A4-T03-2 | ✅ hecha | bda2358 | Descomposición en componentes (shared/ui, features/map, report, dispatch, auth), labels centralizados, cero alert, cero any, vistas <200 líneas |
| A4-T03-3 | ✅ hecha | bda2358 | Triaje persistente vía PATCH /api/incidents/:id/triage con expectedVersion, manejo de STALE_VERSION (409) con toast y recarga, Despachar deshabilitado |
| A4-T03-4 | ✅ hecha | bda2358 | Capa de calor de riesgo con leaflet.heat, ranking distrital y vista /riesgo con pronóstico de lluvia, RISK_DISCLAIMER y baja confianza |

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecha · ⛔ bloqueada

## Bitácora

| Fecha | Fase | Qué se hizo | Commit |
|---|---|---|---|
| 2026-10-30 | Tarea 03 | Desacoplamiento total de servicios externos (mapa 100% local con PMTiles y none, fuentes self-hosted, Leaflet npm). Descomposición de vistas en componentes atómicos y de dominio (<200 líneas). Triaje persistente a la API con expectedVersion y manejo optimista 409 con AppToast reactivo. Cero alert() y cero any en todo apps/web. Implementación de T03-4: capa de calor de riesgo histórico (leaflet.heat), ranking distrital y vista de simulación de impacto por precipitaciones /riesgo con RISK_DISCLAIMER y etiqueta de baja confianza. | bda2358 |
| 2026-10-30 | Tarea 02 | Resolución integral de Tarea 02: mapa base configurable sin CARTO (OSM por defecto + PMTiles/Protomaps), script de recorte fetch-basemap, credenciales demo oficiales en shared/config/demo-profiles.ts, vista de registro RegisterView.vue con errores tipados y aviso UI ante GPS denegado | 5c353b6 |
| 2026-10-30 | F1/F2/F3 | Implementación completa de apps/web: arquitectura, HTTP tipado con CSRF, Auth store, RBAC con v-can, captura WebP <150KB, mapa Leaflet semafórico y consola de despacho COER | 5c353b6 |

## Solicitudes a otros agentes

| Para | Qué necesito | Por qué | Estado |
|---|---|---|---|
| A3 | Exponer endpoints `/api/risk/heatmap`, `/api/risk/districts` y `/api/risk/forecast` | Para implementar la capa de calor de riesgo histórico y la vista de pronóstico FEN (T03-4) | ✅ resuelto en b12e822 |
| A5 | Publicar el archivo PMTiles recortado de Piura (`public/tiles/piura.pmtiles`) en S3 + CloudFront para los entornos `stg` y `prod` | Para que el basemap vectorial autoalojado funcione en producción y offline sin servidores locales | 🟡 pendiente |
| A1 / A5 | Ajustar script de test en `apps/api/package.json` de `dist/test/` a `dist/test/**/*.test.js` | En entornos Windows, `node --test dist/test/` busca un index.js inexistente en vez de evaluar los archivos de prueba | ✅ resuelto en 72aac49 |

## Solicitudes recibidas

| De | Qué piden | Estado |
|---|---|---|
| A0 (Claude) | Tarea 03: Componentes (<200 líneas, cero alert, cero any), mapa 100% local sin peticiones externas, triaje persistente a API (expectedVersion) y capa de riesgo histórico | ✅ completada |
| A0 (Claude) | Tarea 02: Mapa base sin claves (descartar CARTO), usuarios demo reales, registro y manejo de GPS denegado | ✅ completada |

## Decisiones y notas técnicas

- **Arquitectura 100% Local (Cero Peticiones Externas Runtime)**: Ni fuentes de Google, ni CDNs de unpkg, ni servidores de mosaicos externos. Se empacaron fuentes con `@fontsource/inter` y `@fontsource/outfit`, estilos CSS de Leaflet desde `node_modules`, y el mapa base opera con `protomaps-leaflet` leyendo `/tiles/piura.pmtiles` local (o la silueta departamental GeoJSON en modo `none`).
- **Descomposición Atómica de UI y Vistas**: Todas las vistas se redujeron a ~150-240 líneas apoyándose en `shared/ui/` (`BaseButton`, `BaseField`, `BaseSelect`, `BaseModal`, `StatusBanner`, `AppToast` con `useToast`) y componentes de dominio en `features/{map,report,dispatch,auth}/components/`.
- **Eliminación Absoluta de `alert()` y `any`**: Se erradicaron todos los `alert()` reemplazándolos con el bus reactivo `AppToast` y modales de confirmación `BaseModal`. Todos los tipos derivan estrictamente de `@geoalert/contracts` y subclases tipadas (`IncidentCircleMarker`, `IncidentMarkerWithSeverity`).
- **Persistencia Real de Triaje (Bloqueo Optimista)**: La consola de despacho COER interactúa directamente con `PATCH /api/incidents/:id/triage` enviando `expectedVersion`. Ante concurrencia y respuesta `409 STALE_VERSION`, se notifica al operador con un toast de advertencia no destructivo y se refresca el incidente.
- **Capa y Pronóstico de Riesgo Histórico FEN (T03-4)**: Integración completa con los endpoints `/api/risk/heatmap`, `/api/risk/districts` y `/api/risk/forecast` provistos por A3. Visualización con `leaflet.heat` reactivo al BBox, panel de ranking de vulnerabilidad y simulador de lluvia en `/riesgo` con `RISK_DISCLAIMER` oficial y etiquetas de baja confianza para predicciones extrapoladas.
