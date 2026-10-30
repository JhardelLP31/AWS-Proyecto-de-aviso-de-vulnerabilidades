# Contratos de la API v1 (para el frontend)

Tipos TypeScript: `@geoalert/contracts` (`packages/contracts/src/index.ts`). Versión: `CONTRACTS_VERSION = '1.0.0'`.

## Reglas para el cliente

- Base: `/api` (en desarrollo, proxy de Vite a `http://localhost:3000`).
- Siempre `credentials: 'include'`. La sesión es una cookie HttpOnly: **no hay token que guardar**.
- `login` y `register` devuelven `csrfToken`: guárdalo **solo en memoria** (Pinia) y envíalo en
  la cabecera `X-CSRF-Token` en todo `POST`, `PATCH` y `DELETE`. Tras recargar la página, recupéralo con `GET /api/auth/csrf`.
- Errores de negocio: `{ code, message, details }` (403/404/409/422). Validación: `{ statusCode: 400, message: string[] }`.

## Endpoints

| Método | Ruta | Permiso | Cuerpo / query | Respuesta |
|---|---|---|---|---|
| GET | `/health` | público | — | `{ status, data, time }` |
| POST | `/api/auth/register` | público | `RegisterRequest` | `201 SessionResponse` |
| POST | `/api/auth/login` | público | `LoginRequest` | `200 SessionResponse` |
| POST | `/api/auth/logout` | sesión | — | `204` |
| GET | `/api/auth/me` | sesión | — | `MeDTO` |
| GET | `/api/auth/csrf` | público | — | `{ csrfToken: string \| null }` |
| GET | `/api/incidents` | público | `?bbox=minLng,minLat,maxLng,maxLat&status=PENDING,VERIFIED&since=ISO` | `IncidentResponse[]` (máx. 2 000, más graves primero) |
| GET | `/api/incidents/:id` | público | — | `IncidentResponse` |
| POST | `/api/incidents` | `incidents.create` | multipart: `CreateIncidentRequest` + `photos` (≤ 3 archivos WebP ≤ 150 KB) | `201 IncidentResponse` |
| POST | `/api/incidents/:id/votes` | `incidents.vote` | `CastVoteRequest` | `201 IncidentResponse` |
| PATCH | `/api/incidents/:id/triage` | `triage.update` | `TriageRequest` | `IncidentResponse` |
| POST | `/api/incidents/:id/verify` | `incidents.verify` | `{ expectedVersion }` | `201 IncidentResponse` |
| GET | `/api/analytics/summary` | `analytics.read` | `?days=7` | resumen (Fase 4) |
| GET | `/api/risk/heatmap` | público | `?bbox=minLng,minLat,maxLng,maxLat` (opcional) | `RiskHeatCell[]` (celdas de ~1 km, `weight` 0..1; caché 1 h) |
| GET | `/api/risk/districts` | `analytics.read` | — | `DistrictRiskSummary[]` (de mayor a menor `riskScore`) |
| GET | `/api/risk/forecast` | `analytics.read` | `?precipitationMm=0..500` | `RiskForecastResponse` (incluye `disclaimer`, que se muestra siempre) |

> Los endpoints `/api/risk/*` usan los **datos guía** de `data/indeci_historico_piura.json` (5 000 eventos 2010–2023).
> La predicción es empírica: cuenta las severidades de eventos con lluvia parecida (± 10 mm, ampliable a ± 40 mm).
> Si no hay eventos parecidos, usa los 10 más cercanos y marca `extrapolated: true` (mostrar "baja confianza").

## Códigos de error de dominio

| code | HTTP | Cuándo |
|---|---|---|
| `GEOFENCE_VIOLATION` | 422 | Votante a más de 500 m o GPS con precisión > 250 m (`details.distanceM`) |
| `SELF_VOTE_NOT_ALLOWED` | 403 | Votar el propio reporte |
| `INCIDENT_CLOSED` | 409 | Votar un incidente `RESOLVED` |
| `STALE_VERSION` | 409 | Triaje con `expectedVersion` desactualizada: recargar y reintentar |
| `INVALID_PHOTO` | 422 | No es WebP/JPEG, pesa > 200 KB o mide > 1280 px |
| `OUT_OF_COVERAGE_AREA` | 422 | Coordenadas fuera de Piura |
| `EMAIL_ALREADY_REGISTERED` | 409 | Registro con correo existente |
| `INCIDENT_NOT_FOUND` | 404 | — |

## Tiempo real (Socket.io)

- Namespace `/incidents`, mismo origen, `withCredentials: true` (la cookie autentica; sin sesión también conecta, como anónimo).
- Al mover el mapa: `emit('viewport.subscribe', { bbox })` → ack `{ ok, cells }`.
- Opcional: `emit('district.subscribe', { district: 'Castilla' })`.
- Eventos que llegan: `incident.created`, `incident.updated`, `incident.verified` (payload `IncidentResponse`) e
  `incident.vote` (payload `VoteRegisteredPayload`).
- Usuarios con `alerts.receive` (Defensa Civil) entran solos a la sala `dispatch` y reciben todo.

## Usuarios demo

`vecino@demo.pe`, `brigadista@demo.pe`, `coer@demo.pe`, `admin@demo.pe` — contraseña `GeoAlert2026!`.

## Changelog

- **1.0.0** (F1): primera versión congelada.
- **1.1.0**: riesgo histórico (`RiskHeatCell`, `DistrictRiskSummary`, `RiskForecastResponse`, `RISK_DISCLAIMER`). Solo añade; compatible.
