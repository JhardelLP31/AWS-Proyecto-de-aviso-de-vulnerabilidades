# Convenciones de código

## Estructura de cada módulo NestJS (resource)

Cada módulo de `apps/api/src/modules/<modulo>/` sigue la estructura de un *resource* de Nest
(`nest g resource`) ampliada con capas de Clean Architecture:

```
modules/incidents/
├── incidents.module.ts
├── controllers/            # Resource REST: rutas, @RequirePermissions, @Audit, DTOs de entrada
│   └── incidents.controller.ts
├── services/               # Casos de uso. No importan Express, TypeORM ni Socket.io
│   └── incidents.service.ts
├── dto/                    # class-validator + class-transformer (entrada) y mappers (salida)
│   ├── create-incident.dto.ts
│   └── incident-response.mapper.ts
├── entities/               # @Entity de TypeORM (dueño: A2). Entidades muy acopladas pueden ir en un archivo
│   └── incident.entities.ts
├── repositories/           # Interfaz + implementaciones intercambiables
│   ├── incident.repository.ts          # interface IIncidentRepository + token
│   ├── typeorm-incident.repository.ts  # dueño: A2
│   └── mock-incident.repository.ts
├── domain/                 # Reglas puras (sin I/O): veracidad, transiciones, errores, puertos
├── adapters/               # Servicios externos detrás de un puerto (S3, almacenamiento local)
├── types/                  # Tipos e interfaces internas del módulo
├── decorators/  guards/  middlewares/  interceptors/  pipes/   # solo si son propios del módulo
└── __tests__/
```

Lo transversal vive en `apps/api/src/common/` (dueño: A1):

```
common/
├── decorators/     @RequirePermissions, @RequireAnyPermission, @Public, @CurrentUser, @Audit, @SkipAudit
├── guards/         PermissionsGuard (WsAuthGuard en F3)
├── middlewares/    CsrfMiddleware, AuditContextMiddleware, RequestIdMiddleware
├── interceptors/   AuditInterceptor, TimeoutInterceptor
├── pipes/          ParseBBoxPipe
├── filters/        DomainExceptionFilter
├── validators/     @IsInsidePiura, @IsBBox, @IsStrongPassword (@IsWebpFile en F2)
├── errors/         DomainError + httpStatusFor
├── security/       hash de contraseñas (scrypt)
└── types/          ampliación de Express.Request (principal, requestId)
```

## ORM: TypeORM

- Se usa **TypeORM** con PostgreSQL + PostGIS (`@nestjs/typeorm`, `typeorm`, `pg`).
- `synchronize: false` siempre. Todo cambio de esquema va en una **migración** (`apps/api/src/database/migrations/`).
- Columnas geográficas: `@Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })` con índice `@Index({ spatial: true })`.
- Repositorios del dominio **no** exponen `Repository<Entity>` de TypeORM fuera de `repositories/typeorm-*`.
- Comandos (sobre el código compilado, `pnpm build` antes): `pnpm migration:run | migration:revert | migration:generate src/database/migrations/<Nombre> | db:seed | db:import-indeci`.
- Tras cambiar una entidad: `migration:generate`, revisar el SQL a mano y añadir la clase a `database/migrations/index.ts`.
- El CI falla si una entidad cambió sin migración.

## Validación

- `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
- Todo dato de entrada tiene un DTO con decoradores de `class-validator`. Nada de `any` en controllers.
- Las reglas que dependen del estado (geocerca de 500 m, voto duplicado, autovoto) se validan en el **service**, no en el DTO.
- Errores de negocio: subclases de `DomainError` (`kind: not_found | forbidden | conflict | invalid`), nunca `HttpException` dentro de `services/` o `domain/`.

## TypeScript

- `strict: true`, sin `any` implícito, sin `// @ts-ignore`.
- Tipos compartidos con el frontend: solo desde `@geoalert/contracts`.
- Nombres de archivo en `kebab-case`; clases en `PascalCase`; un archivo por clase pública.

## Pruebas

- Runner: **`node:test`** (sin dependencias). Unitarias junto al módulo en `__tests__/*.spec.ts`; generales en `apps/api/test/*.test.ts`.
- `pnpm --filter @geoalert/api test` compila y ejecuta todo. E2E: `API_URL=… node e2e/smoke.mjs` contra una API levantada.
- Toda regla de dominio (veracidad, geocerca, transiciones) tiene pruebas con tablas de casos.
