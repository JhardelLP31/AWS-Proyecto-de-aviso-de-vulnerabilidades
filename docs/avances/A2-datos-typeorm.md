# Avance · A2 Datos, TypeORM y Geoespacial

> Actualiza este archivo **en el mismo commit** que el trabajo que reporta.
> Las tareas y su descripción están en [tu ficha](../agentes/A2-datos-typeorm.md); aquí solo se marca el progreso.

## Estado

| Campo | Valor |
|---|---|
| Ejecutado por | Claude |
| Fase actual | F3 · WebSockets y confirmaciones |
| Siguiente tarea | A2-F3-03 |
| Estado | 🟢 F1 completa (y parte de F2/F3 adelantada) |
| Bloqueado por | — |
| Última actualización | 2026-10-30 |

## Progreso de tareas

| Tarea | Estado | Commit | Notas |
|---|---|---|---|
| A2-F1-01 | ✅ hecha | F1-backend | `src/database/{data-source,typeorm.config,database.module,snake-naming.strategy}.ts`; `synchronize: false` |
| A2-F1-02 | ✅ hecha | F1-backend | `modules/rbac/entities/rbac.entities.ts` (6 entidades) |
| A2-F1-03 | ✅ hecha | F1-backend | `incident.entities.ts` (Incident, IncidentPhoto, IncidentConfirmation) y `audit-log.entity.ts` |
| A2-F1-04 | ✅ hecha | F1-backend | `InitSchema`: postgis + uuid-ossp, `location` generada, GiST total y parcial, CHECKs. Probado: run → revert → run, y `migration:generate` sin desfase |
| A2-F1-05 | ✅ hecha | F1-backend | `pnpm db:seed` idempotente; sincroniza ROLE_MATRIX exactamente |
| A2-F1-06 | ✅ hecha | F1-backend | Permisos efectivos en una sola consulta SQL |
| A2-F1-07 | ✅ hecha | F1-backend | `TypeOrmAuditSink` |
| A2-F1-08 | ✅ hecha | F1-backend | Prisma eliminado (schema, servicio y dependencias) |
| A2-F2-01 | ✅ hecha | F1-backend | `findInBounds` con `&& ST_MakeEnvelope` → usa `incidents_active_location_gist` (verificado con EXPLAIN) |
| A2-F2-02 | ✅ hecha | F1-backend | `pnpm db:import-indeci [archivo|--synthetic]`: 5 000 insertados, re-ejecución inserta 0 |
| A2-F2-03 | ⬜ pendiente | — | Falta el export real de INDECI para ajustar columnas |
| A2-F3-01 | ✅ hecha | F1-backend | `applyVote` con `FOR UPDATE` + upsert por (incident_id, user_id) |
| A2-F3-02 | ✅ hecha | F1-backend | `updateTriage` condicionado por `version` |
| A2-F3-03 | ⬜ pendiente | — | Prueba de 50 votos concurrentes |

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecha · ⛔ bloqueada

## Bitácora

| Fecha | Fase | Qué se hizo | Commit |
|---|---|---|---|
| 2026-10-30 | F1 | TypeORM + PostGIS completo, seeds, importación y Prisma eliminado | F1-backend |

## Solicitudes a otros agentes

| Para | Qué necesito | Por qué | Estado |
|---|---|---|---|
| Jhar | Export real INDECI/GeoSINPAD de Piura (CSV/XLSX) | Ajustar indeci.mapper.ts a las columnas reales | abierta |

## Solicitudes recibidas

| De | Qué piden | Estado |
|---|---|---|
| — | — | — |

## Decisiones y notas técnicas

- Tablas y columnas en snake_case (SnakeNamingStrategy); propiedades en camelCase.
- Entidades y migraciones registradas en listas explícitas (sin globs) para que el bundle de Lambda las incluya.
- La columna `location` no se escribe nunca desde la app: Postgres la genera desde lat/lng.
