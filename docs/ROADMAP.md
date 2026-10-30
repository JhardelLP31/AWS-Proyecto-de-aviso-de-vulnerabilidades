# Roadmap — GeoAlert / ResQMap (hackathon)

Plataforma colaborativa en tiempo real ("Waze de desastres") para Piura ante el Fenómeno El Niño.
Las fases son secuenciales; dentro de cada fase los agentes trabajan en paralelo.
Una fase se cierra cuando A0 marca su *checklist de cierre* y A5 promueve `dev` → `stg`.

## Estado actual

| Fase | Estado | Rama donde vive |
|---|---|---|
| F0 · Blueprint y equipo | ✅ cerrada | `dev`, `stg`, `prod` |
| F1 · Auth, RBAC y datos mock | 🔜 siguiente | `dev` |
| F2 · Pipeline de imágenes e incidentes | ⏳ | — |
| F3 · WebSockets y confirmaciones | ⏳ | — |
| F4 · Despliegue serverless e insignias | ⏳ | — |

## F0 · Blueprint (hecho)

Ya existe en `apps/api` un backend NestJS que compila y pasa pruebas en modo mock:
auth con cookie HttpOnly + CSRF, RBAC con `@RequirePermissions` y `PermissionsGuard`, `AuditInterceptor`,
servicio de incidentes con motor de veracidad y geocerca, gateway Socket.io por celdas geohash,
`lambda.ts`, 5 000 registros INDECI sintéticos. Usa **Prisma**: en F1 se migra a **TypeORM**.

## F1 · Auth, RBAC y datos mock

| Agente | Trabajo |
|---|---|
| A0 | Contratos v1 congelados, convención de módulos aplicada a la estructura, revisión de PRs |
| A1 | Mover decoradores/guards/middlewares/pipes a `common/`, validadores custom, `RequestIdMiddleware`, refresh de sesión |
| A2 | TypeORM + PostGIS: `data-source`, entidades RBAC e incidentes, migración inicial, seeds de roles/permisos, quitar Prisma |
| A3 | Reestructurar `incidents` como *resource* (controllers/services/dto/repositories), repositorio mock detrás de la interfaz |
| A4 | Scaffold Vue 3 + Vite + Pinia + Router, login con cookie, `usePermissions` + `v-can`, guards de ruta |
| A5 | CI (typecheck + tests) en `dev`/`stg`/`prod`, protección de ramas, docker-compose (Postgres+PostGIS, Redis) |

**Cierre F1**: login → `/auth/me` → navegación protegida por permisos en el SPA, todo contra Postgres real con seeds.

## F2 · Pipeline de imágenes e incidentes

| Agente | Trabajo |
|---|---|
| A1 | Validador `@IsWebpFile`, límites de multipart, rate limit por endpoint |
| A2 | Entidad `IncidentPhoto`, `TypeOrmIncidentRepository.findInBounds` con `ST_MakeEnvelope`, import INDECI real |
| A3 | `POST /incidents` multipart, inspección de fotos por bytes mágicos, almacenamiento local/S3 |
| A4 | `useCameraWebp` (cámara + canvas + WebP < 150 KB), formulario de reporte, `DisasterMap.vue` con clustering y capas semafóricas |
| A5 | Bucket S3 + CloudFront (IaC), pruebas e2e del flujo de reporte |

**Cierre F2**: un vecino toma una foto en el móvil, se sube en WebP < 150 KB y aparece en el mapa.

## F3 · WebSockets y confirmaciones

| Agente | Trabajo |
|---|---|
| A1 | Autenticación del handshake WebSocket (cookie + Origin), auditoría de rechazos |
| A2 | Entidad `IncidentConfirmation` (único por usuario), bloqueo `FOR UPDATE`, índices |
| A3 | Votos con geocerca 500 m, recálculo de veracidad, escalamiento a VERIFIED, gateway por celdas/distrito/despacho |
| A4 | Botón "Confirmar peligro en el lugar" con geocerca en cliente, actualización en vivo del mapa, panel de despacho |
| A5 | Servidor realtime (Fargate) con Redis adapter, prueba de carga de votos concurrentes |

**Cierre F3**: dos navegadores ven en vivo cómo sube el score y llega la alerta a Defensa Civil.

## F4 · Despliegue serverless e insignias

| Agente | Trabajo |
|---|---|
| A1 | Insignia de brigadista (permiso `incidents.vote.brigade`), reputación `w_u`, endpoints de administración RBAC |
| A2 | Job de recálculo de reputación, retención y particionado de `audit_log` |
| A3 | Analítica (carga perezosa), tiempos de verificación por distrito |
| A4 | PWA (offline + reintentos de subida), panel de analítica |
| A5 | Lambda + API Gateway + RDS Proxy + WAF, promoción `stg` → `prod`, runbook |

**Cierre F4**: demo en `prod` con URL pública.

## Migración del dataset mock (5 000 registros) a persistencia real

1. **Mismo mapeador**: `indeci.mapper.ts` convierte cada registro al modelo del dominio, tanto para el repositorio
   mock como para la importación. Si el mapeo es correcto en mock, es correcto en Postgres.
2. **Idempotencia**: `externalRef = "INDECI:<codigo>"` es UNIQUE; la importación usa *insert … on conflict do nothing*
   en lotes de 500, así que se puede repetir sin duplicar.
3. **Rechazos**: los registros con coordenadas o fechas inválidas se escriben en `import-rechazos.json`, no abortan el lote.
4. **Corte**: `INCIDENTS_DRIVER=mock` → `postgres` es una variable de entorno; no cambia código.
5. **Verificación**: A5 compara conteos por distrito y por severidad entre mock y Postgres en una prueba e2e.
