# Avance · A3 Incidentes, Veracidad y Tiempo Real

> Actualiza este archivo **en el mismo commit** que el trabajo que reporta.
> Las tareas y su descripción están en [tu ficha](../agentes/A3-incidentes-tiempo-real.md); aquí solo se marca el progreso.

## Estado

| Campo | Valor |
|---|---|
| Ejecutado por | Claude |
| Fase actual | F2 · Pipeline de imágenes e incidentes |
| Siguiente tarea | A3-F2-02 |
| Estado | 🟢 F1 completa |
| Bloqueado por | — |
| Última actualización | 2026-10-30 |

## Progreso de tareas

| Tarea | Estado | Commit | Notas |
|---|---|---|---|
| A3-F1-01 | ✅ hecha | F1-backend | `controllers/ services/ dto/ entities/ repositories/ domain/ types/ adapters/ __tests__/` |
| A3-F1-02 | ✅ hecha | F1-backend | `create-incident`, `cast-vote`, `triage` (+`VerifyIncidentDto`), `bounds-query`, `incident-response.mapper` |
| A3-F1-03 | ✅ hecha | F1-backend | 8 pruebas del service: geocerca, GPS impreciso, autovoto, reemplazo de voto, escalamiento único, resuelto, bloqueo optimista |
| A3-F2-01 | ✅ hecha | F0 | Multipart + bytes mágicos + almacenamiento local/S3 (del blueprint) |
| A3-F2-02 | ⬜ pendiente | — | Etiquetado linked=true de fotos |
| A3-F2-03 | ⬜ pendiente | — | Paginación y filtros por tipo/severidad |

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecha · ⛔ bloqueada

## Bitácora

| Fecha | Fase | Qué se hizo | Commit |
|---|---|---|---|
| 2026-10-30 | F1 | Módulo incidents reestructurado como resource y pruebas del service | F1-backend |
| 2026-10-30 | F2 | Módulo `risk`: heatmap, ranking por distrito y predicción empírica con los datos guía de `data/` (11 pruebas + paso e2e) | este commit |

## Solicitudes a otros agentes

| Para | Qué necesito | Por qué | Estado |
|---|---|---|---|
| — | — | — | — |

## Solicitudes recibidas

| De | Qué piden | Estado |
|---|---|---|
| — | — | — |

## Decisiones y notas técnicas

- `IncidentService` renombrado a `IncidentsService` (convención resource de Nest).
- El puerto `IIncidentRepository` vive en `repositories/incident.repository.ts`; los puertos de eventos y fotos en `domain/ports.ts`.
