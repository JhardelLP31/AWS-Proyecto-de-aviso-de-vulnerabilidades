# Avance · A4 Frontend Vue 3

> Actualiza este archivo **en el mismo commit** que el trabajo que reporta.
> Las tareas y su descripción están en [tu ficha](../agentes/A4-frontend-vue.md); aquí solo se marca el progreso.

## Estado

| Campo | Valor |
|---|---|
| Fase actual | F1 · Auth, RBAC y datos mock / F2-F3 Core |
| Siguiente tarea | A4-F4-01 |
| Ejecutado por | Antigravity |
| Estado | 🟢 activo / tareas F1 completadas |
| Bloqueado por | — |
| Última actualización | 2026-10-30 |

## Progreso de tareas

| Tarea | Estado | Commit | Notas |
|---|---|---|---|
| A4-F1-01 | ✅ hecha | [A4] feat(web) | Scaffold Vite + Vue 3 + TS estricto + Pinia + Router + proxy /api y /socket.io |
| A4-F1-02 | ✅ hecha | [A4] feat(web) | shared/api/http.ts con credentials include, CSRF en memoria y errores tipados 401/403/422 |
| A4-F1-03 | ✅ hecha | [A4] feat(web) | useAuthStore (login, logout, me, permisos) y LoginView.vue con perfiles demo de Piura |
| A4-F1-04 | ✅ hecha | [A4] feat(web) | usePermissions.ts con can/canAny/canAll y directiva v-can con modificador .disable |
| A4-F1-05 | ✅ hecha | [A4] feat(web) | Guards de navegación global evaluando meta.permissions contra contratos |
| A4-F2-01 | ✅ hecha | [A4] feat(web) | useCameraWebp.ts con EXIF, OffscreenCanvas, loop adaptativo <150KB y fallback JPEG |
| A4-F2-02 | ✅ hecha | [A4] feat(web) | ReportIncidentView.vue con tipo, severidad, GPS, hasta 3 fotos y multipart |
| A4-F2-03 | ✅ hecha | [A4] feat(web) | DisasterMap.vue con Leaflet Canvas, clustering semafórico de peor severidad y bbox |
| A4-F3-01 | ✅ hecha | [A4] feat(web) | useIncidentsSocket.ts con conexión por cookie, viewport.subscribe y eventos |
| A4-F3-02 | ✅ hecha | [A4] feat(web) | IncidentPopup.vue con botón de validación in situ <500m (Haversine) y desmentido |
| A4-F3-03 | ✅ hecha | [A4] feat(web) | DispatchDashboard.vue con cola de triaje en vivo y métricas de cuenca |

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecha · ⛔ bloqueada

## Bitácora

| Fecha | Fase | Qué se hizo | Commit |
|---|---|---|---|
| 2026-10-30 | F1/F2/F3 | Implementación completa de apps/web: arquitectura, HTTP tipado con CSRF, Auth store, RBAC con v-can, captura WebP <150KB, mapa Leaflet semafórico y consola de despacho COER | [A4] feat(web): spa vue 3 completa con mapa semaforico, rbac y pipeline webp |

## Solicitudes a otros agentes

| Para | Qué necesito | Por qué | Estado |
|---|---|---|---|
| A1 / A5 | Ajustar script de test en `apps/api/package.json` de `dist/test/` a `dist/test/**/*.test.js` | En entornos Windows, `node --test dist/test/` busca un index.js inexistente en vez de evaluar los archivos de prueba | 🟡 pendiente |

## Solicitudes recibidas

| De | Qué piden | Estado |
|---|---|---|
| — | — | — |

## Decisiones y notas técnicas

- **Seguridad de Sesiones**: Cumplimiento estricto de cero tokens en `localStorage`. La sesión viaja exclusivamente por cookies `HttpOnly` y el token CSRF vive en la memoria RAM del cliente (`http.ts`), refrescándose vía `/api/auth/csrf`.
- **Rendimiento Geoespacial**: El mapa utiliza `preferCanvas: true` en Leaflet y Marker Clustering personalizado donde cada cluster toma el color y animación de la peor severidad contenida (Rojo pulsa si hay al menos una rotura de dique o desborde).
- **Compresión de Imágenes en Terreno**: `useCameraWebp` garantiza que ninguna imagen enviada por los brigadistas en el Bajo Piura supere los 150 KB mediante un loop de compresión adaptativo, protegiendo el ancho de banda ante colapsos de red.
