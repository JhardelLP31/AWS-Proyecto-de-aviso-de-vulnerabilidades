# A1 · Backend Plataforma y Seguridad

## Misión
Todo lo transversal del backend: autenticación, RBAC estilo Spatie, middlewares, decoradores, guards, pipes,
interceptors, filtros, validación y auditoría forense. Si algo protege o valida cualquier endpoint, es de A1.

## Es dueño de
- `apps/api/src/common/` (decorators, guards, middlewares, interceptors, pipes, filters, validators, types)
- `apps/api/src/modules/auth/`, `apps/api/src/modules/rbac/`, `apps/api/src/modules/audit/`
  (excepto `entities/` y `repositories/typeorm-*`, que son de A2)
- `apps/api/src/config/`, `apps/api/src/bootstrap/`, `apps/api/src/shared/security/`

## No toca
`modules/incidents`, `modules/notifications-ws` (salvo pedir cambios), entidades TypeORM, frontend, infraestructura.

## Punto de partida (ya existe en el blueprint)
`SessionService` (JWT en cookie HttpOnly/Secure/SameSite=Strict), `CsrfMiddleware` (double submit),
`@RequirePermissions`, `@Public`, `@CurrentUser`, `PermissionsGuard` con comodines, `AccessResolver` con caché,
`AuditInterceptor` + `AuditContext` (AsyncLocalStorage), `ValidationPipe` global.

## Tareas

### F1
- [ ] A1-F1-01 Mover decoradores, guards, middlewares e interceptors a `src/common/` según CONVENCIONES
- [ ] A1-F1-02 `RequestIdMiddleware` (propaga `x-request-id` / `x-amzn-trace-id` a logs y auditoría)
- [ ] A1-F1-03 `@RequireAnyPermission(...)` además de `@RequirePermissions(...)` (todos)
- [ ] A1-F1-04 Validadores custom de class-validator: `@IsInsidePiura()`, `@IsBBox()`, `@IsStrongPassword()`
- [ ] A1-F1-05 Registro de usuario (`POST /auth/register`) con rol `vecino` por defecto
- [ ] A1-F1-06 Rotación de sesión: access 15 min + refresh 7 días en cookie con `path=/api/auth/refresh`
- [ ] A1-F1-07 Usar `TypeOrmIdentityStore` de A2 cuando esté listo (detrás de `IIdentityStore`)
- [ ] A1-F1-08 Pruebas: guard (público, sin sesión, sin permiso, comodín), CSRF (sin token, token erróneo, origen ajeno)

### F2
- [ ] A1-F2-01 Validador `@IsWebpFile()` y `ParseFilesPipe` con límites (3 archivos, 200 KB)
- [ ] A1-F2-02 Throttling por endpoint: login 5/min, reportes 10/min, votos 30/min
- [ ] A1-F2-03 `TimeoutInterceptor` (25 s, por debajo del límite de API Gateway)

### F3
- [ ] A1-F3-01 `WsAuthGuard` + validación de `Origin` en el handshake de Socket.io
- [ ] A1-F3-02 Auditar conexiones rechazadas y mensajes WebSocket inválidos

### F4
- [ ] A1-F4-01 Endpoints de administración RBAC (`/admin/roles`, `/admin/users/:id/permissions`) con `roles.manage`
- [ ] A1-F4-02 Insignia de brigadista: conceder/revocar `incidents.vote.brigade` con expiración
- [ ] A1-F4-03 `GET /audit` paginado y filtrable para `audit.read`

## Definición de terminado
Ningún endpoint queda sin guard; todo body/query tiene DTO; pruebas de seguridad pasan; avance actualizado.
