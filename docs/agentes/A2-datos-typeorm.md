# A2 · Datos, TypeORM y Geoespacial

## Misión
Persistencia real del sistema con **TypeORM + PostgreSQL + PostGIS**: entidades, migraciones, repositorios
TypeORM detrás de las interfaces del dominio, seeds de RBAC e importación del dataset INDECI/GeoSINPAD.

## Es dueño de
- `apps/api/src/database/` (`data-source.ts`, `migrations/`, `seeds/`, `typeorm.module.ts`)
- `apps/api/src/modules/*/entities/` (todas las `@Entity`)
- `apps/api/src/modules/*/repositories/typeorm-*.ts`
- `apps/api/scripts/` (importación INDECI, utilidades de datos)
- Eliminación de `apps/api/prisma/` y de `shared/prisma/` cuando TypeORM esté operativo

## No toca
Services, controllers, guards, gateway, frontend, infraestructura.

## Modelo a implementar
Partir de `apps/api/prisma/schema.prisma` y `apps/api/prisma/sql/postgis.sql` (son la especificación):
`User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserPermission`, `Incident`
(con `location geometry(Point,4326)` generada desde lat/lng e índice GIST), `IncidentPhoto`,
`IncidentConfirmation` (UNIQUE incidentId+userId), `AuditLog` (append-only).

## Tareas

### F1
- [ ] A2-F1-01 Instalar `@nestjs/typeorm`, `typeorm`, `pg`; crear `database/data-source.ts` (`synchronize: false`) y `DatabaseModule`
- [ ] A2-F1-02 Entidades RBAC: `UserEntity`, `RoleEntity`, `PermissionEntity`, `UserRoleEntity`, `RolePermissionEntity`, `UserPermissionEntity`
- [ ] A2-F1-03 Entidades `IncidentEntity`, `IncidentPhotoEntity`, `IncidentConfirmationEntity`, `AuditLogEntity`
- [ ] A2-F1-04 Migración inicial con extensión PostGIS, columna generada `location`, índices GIST y CHECKs
- [ ] A2-F1-05 Seed de roles y permisos desde `ROLE_MATRIX` + usuarios demo (idempotente)
- [ ] A2-F1-06 `TypeOrmIdentityStore implements IIdentityStore` (permisos efectivos en una consulta)
- [ ] A2-F1-07 `TypeOrmAuditSink implements IAuditSink`
- [ ] A2-F1-08 Eliminar Prisma (schema, servicio, dependencias) y avisar a A1/A3

### F2
- [ ] A2-F2-01 `TypeOrmIncidentRepository implements IIncidentRepository`: `findById`, `create`, `findInBounds` con `&& ST_MakeEnvelope`
- [ ] A2-F2-02 Script de importación INDECI en lotes de 500 con `ON CONFLICT (external_ref) DO NOTHING` y archivo de rechazos
- [ ] A2-F2-03 Ajustar `indeci.mapper.ts` a las columnas del export real (coordinar con A3)

### F3
- [ ] A2-F3-01 `applyVote` transaccional con `SELECT … FOR UPDATE` y upsert del voto
- [ ] A2-F3-02 `updateTriage` con bloqueo optimista por `version`
- [ ] A2-F3-03 Prueba de concurrencia: 50 votos simultáneos → score consistente

### F4
- [ ] A2-F4-01 Job de recálculo de reputación `w_u` según acierto histórico
- [ ] A2-F4-02 Retención/particionado mensual de `audit_log` y `REVOKE UPDATE, DELETE` al rol de la app

## Definición de terminado
`migration:run` sobre una base vacía deja el esquema completo; los seeds son idempotentes; los repositorios pasan
las mismas pruebas que el repositorio mock.
