# Avance · A5 DevOps Serverless y QA

> Actualiza este archivo **en el mismo commit** que el trabajo que reporta.
> Las tareas y su descripción están en [tu ficha](../agentes/A5-devops-qa.md); aquí solo se marca el progreso.

## Estado

| Campo | Valor |
|---|---|
| Ejecutado por | Claude |
| Fase actual | F2 · Pipeline de imágenes e incidentes |
| Siguiente tarea | A5-F1-02 |
| Estado | 🟡 F1 casi completa |
| Bloqueado por | Aprobación de Jhar para proteger ramas |
| Última actualización | 2026-10-30 |

## Progreso de tareas

| Tarea | Estado | Commit | Notas |
|---|---|---|---|
| A5-F1-01 | ✅ hecha | F1-backend | `.github/workflows/ci.yml`: typecheck, unitarias, migraciones run/revert/run, chequeo de desfase, e2e contra PostGIS, bundle Lambda |
| A5-F1-02 | ⛔ bloqueada | — | Proteger `stg`/`prod` cambia la configuración del repo: requiere el visto bueno de Jhar |
| A5-F1-03 | ✅ hecha | F1-backend | `docker-compose.yml`: postgis/postgis:16-3.4 + redis:7 con healthchecks |
| A5-F1-04 | ✅ hecha | F1-backend | Runner elegido: `node:test` (sin dependencias); documentado en CONVENCIONES |
| extra | ✅ hecha | F1-backend | `e2e/smoke.mjs`: 15 pasos (registro, login, CSRF, autovoto, geocerca, verificación, RBAC, bloqueo optimista, logout) |
| extra | ✅ hecha | F1-backend | `build-lambda.mjs` actualizado para TypeORM (bundle 3.7 MB) |

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecha · ⛔ bloqueada

## Bitácora

| Fecha | Fase | Qué se hizo | Commit |
|---|---|---|---|
| 2026-10-30 | F1 | CI, docker-compose, e2e de humo y bundle Lambda con TypeORM | F1-backend |

## Solicitudes a otros agentes

| Para | Qué necesito | Por qué | Estado |
|---|---|---|---|
| Jhar | Aprobar protección de ramas stg/prod (solo por PR con CI verde) | Evitar pushes directos a stg/prod | abierta |

## Solicitudes recibidas

| De | Qué piden | Estado |
|---|---|---|
| — | — | — |

## Decisiones y notas técnicas

- El CI todavía no se ha ejecutado en GitHub: correrá con el primer push a dev.
