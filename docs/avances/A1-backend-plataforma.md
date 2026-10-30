# Avance · A1 Backend Plataforma y Seguridad

> Actualiza este archivo **en el mismo commit** que el trabajo que reporta.
> Las tareas y su descripción están en [tu ficha](../agentes/A1-backend-plataforma.md); aquí solo se marca el progreso.

## Estado

| Campo | Valor |
|---|---|
| Ejecutado por | Claude |
| Fase actual | F2 · Pipeline de imágenes e incidentes |
| Siguiente tarea | A1-F1-06 (pendiente de F1) y luego A1-F2-01 |
| Estado | 🟢 F1 casi completa |
| Bloqueado por | — |
| Última actualización | 2026-10-30 |

## Progreso de tareas

| Tarea | Estado | Commit | Notas |
|---|---|---|---|
| A1-F1-01 | ✅ hecha | F1-backend | `src/common/{decorators,guards,middlewares,interceptors,pipes,filters,validators,errors,types}` |
| A1-F1-02 | ✅ hecha | F1-backend | `requestIdMiddleware`: reutiliza x-amzn-trace-id / x-request-id o genera UUID; va a auditoría y a la respuesta |
| A1-F1-03 | ✅ hecha | F1-backend | `@RequireAnyPermission(...)` |
| A1-F1-04 | ✅ hecha | F1-backend | `@IsInsidePiura`, `@IsBBox`, `@IsStrongPassword` + `ParseBBoxPipe` |
| A1-F1-05 | ✅ hecha | F1-backend | `POST /auth/register` → rol vecino, sesión abierta, throttle 3/min |
| A1-F1-06 | ⬜ pendiente | — | Rotación access/refresh: necesita tabla de sesiones para revocar; se hará junto con F2 |
| A1-F1-07 | ✅ hecha | F1-backend | `TypeOrmIdentityStore` (hecho por A2) cableado vía `IIdentityStore` |
| A1-F1-08 | ✅ hecha | F1-backend | Pruebas de guard (7), CSRF (6) y validadores (6) |
| extra | ✅ hecha | F1-backend | `AuthService` (lógica fuera del controller), `TimeoutInterceptor` 25 s, `DomainExceptionFilter` en `common/filters` |

Leyenda: ⬜ pendiente · 🔄 en curso · ✅ hecha · ⛔ bloqueada

## Bitácora

| Fecha | Fase | Qué se hizo | Commit |
|---|---|---|---|
| 2026-10-30 | F1 | Capa transversal movida a common/, registro, request-id, validadores, timeout y pruebas | F1-backend |

## Solicitudes a otros agentes

| Para | Qué necesito | Por qué | Estado |
|---|---|---|---|
| — | — | — | — |

## Solicitudes recibidas

| De | Qué piden | Estado |
|---|---|---|
| — | — | — |

## Decisiones y notas técnicas

- Orden de middlewares (AppModule): requestId → auditContext → CSRF. Luego ThrottlerGuard, PermissionsGuard, TimeoutInterceptor, AuditInterceptor.
- El rechazo de CSRF ocurre en middleware y no queda en audit_logs; se evaluará en F3 junto con la auditoría de WebSocket.
