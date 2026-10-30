# A3 · Incidentes, Veracidad y Tiempo Real

## Misión
El corazón del producto: reportar incidentes con fotos, confirmarlos o desmentirlos con geocerca,
calcular el puntaje de veracidad, escalar a "Verificado" y emitir todo en vivo por WebSocket.

## Es dueño de
- `apps/api/src/modules/incidents/` (controllers, services, dto, domain, types, repositorio mock, almacenamiento de fotos)
- `apps/api/src/modules/notifications-ws/` (gateway, salas, publishers)
- `apps/api/src/modules/analytics/`
- Excepto `entities/` y `repositories/typeorm-*` (son de A2)

## No toca
`common/`, auth, RBAC, entidades TypeORM, frontend, infraestructura.

## Punto de partida (ya existe en el blueprint)
`IncidentService` (report, vote, triage), `veracity.ts` con la fórmula
`Σ(confirmaciones × w_u) − Σ(desmentidos) × 1.5 + BonusBrigadista`, geocerca de 500 m en servidor,
`LocalMockIncidentRepository` con 5 000 registros, `IncidentsGateway` con salas por geohash/distrito/despacho,
`RedisEmitterBroadcaster` para Lambda.

## Tareas

### F1
- [ ] A3-F1-01 Reestructurar `incidents` como *resource*: `controllers/`, `services/`, `dto/`, `repositories/`, `domain/`, `types/`
- [ ] A3-F1-02 Separar DTOs: `create-incident.dto.ts`, `cast-vote.dto.ts`, `triage.dto.ts`, `bounds-query.dto.ts`, `incident-response.mapper.ts`
- [ ] A3-F1-03 Pruebas unitarias del service con el repositorio mock (geocerca, autovoto, incidente resuelto)

### F2
- [ ] A3-F2-01 `POST /incidents` multipart con hasta 3 fotos; inspección por bytes mágicos; almacenamiento local/S3
- [ ] A3-F2-02 Etiquetado `linked=true` de las fotos tras persistir (limpieza de huérfanas)
- [ ] A3-F2-03 `GET /incidents?bbox=` paginado y con filtros por tipo y severidad

### F3
- [ ] A3-F3-01 `POST /incidents/:id/votes`: voto único reemplazable, recálculo y transición de estado
- [ ] A3-F3-02 Emisión `incident.created`, `incident.vote`, `incident.updated`, `incident.verified` a las salas correctas
- [ ] A3-F3-03 `viewport.subscribe` con celdas geohash (precisión 5 → 4) y `district.subscribe`
- [ ] A3-F3-04 Pruebas de la fórmula y de las transiciones con tablas de casos (ampliar `test/veracity.test.ts`)

### F4
- [ ] A3-F4-01 Analítica con carga perezosa: incidentes por distrito, tiempo medio a verificación
- [ ] A3-F4-02 Ajuste de umbrales (`VeracityPolicy`) por configuración

## Definición de terminado
El service no importa nada de Express, TypeORM ni Socket.io; todas las reglas tienen prueba; los eventos llegan
solo a las salas que corresponden.
