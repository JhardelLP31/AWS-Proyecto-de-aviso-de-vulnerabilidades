# Equipo de agentes IA

Seis agentes, cada uno dueño de un área. El reparto busca que **dos agentes nunca editen el mismo archivo**,
para que puedan trabajar en paralelo sobre `dev` sin conflictos.

| Rol | Agente | Lo ejecuta | Es dueño de | Ficha | Avance |
|---|---|---|---|---|---|
| A0 | Arquitecto e Integrador | Claude | `packages/contracts/`, `docs/`, archivos raíz, `apps/api/src/app.module.ts` | [A0](A0-arquitecto-integrador.md) | [avance](../avances/A0-arquitecto-integrador.md) |
| A1 | Backend Plataforma y Seguridad | Claude | `apps/api/src/modules/{auth,rbac,audit}/`, `apps/api/src/common/`, `apps/api/src/config/` | [A1](A1-backend-plataforma.md) | [avance](../avances/A1-backend-plataforma.md) |
| A2 | Datos, TypeORM y Geoespacial | Claude | `apps/api/src/database/`, `apps/api/src/modules/*/entities/`, `apps/api/src/modules/*/repositories/typeorm-*`, `apps/api/scripts/` | [A2](A2-datos-typeorm.md) | [avance](../avances/A2-datos-typeorm.md) |
| A3 | Incidentes, Veracidad y Tiempo Real | Claude | `apps/api/src/modules/{incidents,notifications-ws,analytics,risk}/` (excepto `entities/` y `typeorm-*`) | [A3](A3-incidentes-tiempo-real.md) | [avance](../avances/A3-incidentes-tiempo-real.md) |
| A4 | Frontend Vue 3 | Antigravity | `apps/web/` | [A4](A4-frontend-vue.md) | [avance](../avances/A4-frontend-vue.md) |
| A5 | DevOps Serverless y QA | Claude | `infra/`, `.github/`, `apps/api/src/lambda.ts`, `apps/api/src/main-realtime.ts`, `apps/api/scripts/build-lambda.mjs`, `e2e/` | [A5](A5-devops-qa.md) | [avance](../avances/A5-devops-qa.md) |

> **Reparto actual**: Claude ejecuta todo el backend (A0, A1, A2, A3, A5). Antigravity ejecuta el frontend (A4)
> siguiendo [A4-frontend-vue.md](A4-frontend-vue.md) y el contrato de la API en [docs/contratos.md](../contratos.md).

## Cómo se coordinan

```
            ┌──────────────── A0 Arquitecto ────────────────┐
            │ contratos, convenciones, revisión de dev       │
            └──────┬───────────┬───────────┬───────────┬────┘
                   │           │           │           │
         A1 Plataforma   A2 Datos    A3 Incidentes   A4 Frontend
         (auth, RBAC,   (TypeORM,   (resource,      (Vue, mapa,
          middlewares,   PostGIS,    veracidad,      cámara WebP)
          validación)    seeds)      WebSockets)
                   │           │           │           │
                   └───────────┴─────┬─────┴───────────┘
                                     │
                             A5 DevOps y QA
                    (Lambda, CI, stg/prod, pruebas e2e)
```

- **Dependencias duras**: A3 necesita las entidades de A2 y los decoradores/guards de A1. A4 necesita los contratos de A0
  y los endpoints de A3. Mientras no estén, cada uno trabaja contra el **modo mock** (`INCIDENTS_DRIVER=mock`).
- **Pedir algo a otro agente**: añádelo a *Solicitudes a otros agentes* en tu avance **y** a *Solicitudes recibidas*
  en el avance del otro, en el mismo commit.
- **Promoción de ramas**: `dev` → `stg` la hace A5 cuando A0 da el visto bueno de la fase.
  `stg` → `prod` solo con aprobación humana (Jhar).

## Cómo lanzar a un agente

Prompt sugerido (cambia el rol):

> Eres el agente **A2 – Datos, TypeORM y Geoespacial** del proyecto GeoAlert / ResQMap.
> Clona el repositorio, cámbiate a la rama `dev`, lee `AGENTS.md`, tu ficha `docs/agentes/A2-datos-typeorm.md`
> y tu avance `docs/avances/A2-datos-typeorm.md`. Continúa con la primera tarea sin marcar de la fase actual.
> Al terminar cada tarea: actualiza tu avance, ejecuta `pnpm typecheck && pnpm test`, haz commit y push a `dev`.
