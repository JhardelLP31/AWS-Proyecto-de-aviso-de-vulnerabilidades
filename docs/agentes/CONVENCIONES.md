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
├── entities/               # @Entity de TypeORM (dueño: A2)
│   └── incident.entity.ts
├── repositories/           # Interfaz + implementaciones intercambiables
│   ├── incident.repository.ts          # interface IIncidentRepository + token
│   ├── typeorm-incident.repository.ts  # dueño: A2
│   └── mock-incident.repository.ts
├── domain/                 # Reglas puras (sin I/O): veracidad, transiciones, errores
├── types/                  # Tipos e interfaces internas del módulo
├── decorators/  guards/  middlewares/  interceptors/  pipes/   # solo si son propios del módulo
└── __tests__/
```

Lo transversal vive en `apps/api/src/common/` (dueño: A1):

```
common/
├── decorators/     @RequirePermissions, @Public, @CurrentUser, @Audit, @SkipAudit
├── guards/         PermissionsGuard, WsAuthGuard
├── middlewares/    CsrfMiddleware, AuditContextMiddleware, RequestIdMiddleware
├── interceptors/   AuditInterceptor, TimeoutInterceptor
├── pipes/          ParseBBoxPipe, ParseGeoPointPipe
├── filters/        DomainExceptionFilter
├── validators/     @IsInsidePiura, @IsWebpFile, @IsBBox (class-validator custom)
└── types/          AccessProfile, AuthenticatedRequest
```

## ORM: TypeORM

- Se usa **TypeORM** con PostgreSQL + PostGIS (`@nestjs/typeorm`, `typeorm`, `pg`).
- `synchronize: false` siempre. Todo cambio de esquema va en una **migración** (`apps/api/src/database/migrations/`).
- Columnas geográficas: `@Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })` con índice `@Index({ spatial: true })`.
- Repositorios del dominio **no** exponen `Repository<Entity>` de TypeORM fuera de `repositories/typeorm-*`.
- El blueprint inicial usa Prisma (`apps/api/prisma/`); A2 lo reemplaza por TypeORM en la Fase 1 y elimina Prisma.

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

- Unitarias junto al módulo (`__tests__/*.spec.ts`), con `node:test` o Jest (A5 decide en Fase 1 y lo documenta aquí).
- Toda regla de dominio (veracidad, geocerca, transiciones) tiene pruebas con tablas de casos.
