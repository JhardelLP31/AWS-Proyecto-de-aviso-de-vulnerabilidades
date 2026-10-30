# A0 · Arquitecto e Integrador

## Misión
Mantener la coherencia del sistema: contratos entre frontend y backend, convenciones, orden de las fases
y calidad de lo que entra en `dev`. No implementa features; desbloquea a los demás.

## Es dueño de
- `packages/contracts/` (DTOs, eventos WebSocket, permisos, utilidades geo compartidas)
- `docs/` (excepto el archivo de avance de cada agente, que es de su dueño)
- Archivos raíz: `README.md`, `AGENTS.md`, `package.json`, `pnpm-workspace.yaml`, `.gitignore`
- `apps/api/src/app.module.ts` (registro de módulos)

## No toca
Código dentro de `apps/api/src/modules/`, `apps/web/`, `infra/`, `.github/`.

## Tareas

### F1
- [ ] A0-F1-01 Congelar contratos v1 (`IncidentDTO`, `MeDTO`, `WsEvents`, `PERMISSIONS`) y publicar changelog en `docs/contratos.md`
- [ ] A0-F1-02 Añadir a contratos `CreateIncidentRequest`, `CastVoteRequest`, `TriageRequest` y `ApiError`
- [ ] A0-F1-03 Revisar que la estructura de módulos siga `docs/agentes/CONVENCIONES.md` tras los cambios de A1/A2/A3
- [ ] A0-F1-04 Checklist de cierre F1 y aviso a A5 para promover a `stg`

### F2
- [ ] A0-F2-01 Contrato de subida de fotos (campos multipart, límites, códigos de error)
- [ ] A0-F2-02 Revisión de seguridad del pipeline de imágenes (tamaño, tipo, EXIF)
- [ ] A0-F2-03 Checklist de cierre F2

### F3
- [ ] A0-F3-01 Contrato de eventos en vivo y salas (`cell:*`, `district:*`, `dispatch`)
- [ ] A0-F3-02 Validar la fórmula de veracidad y los umbrales con datos reales de prueba
- [ ] A0-F3-03 Checklist de cierre F3

### F4
- [ ] A0-F4-01 Documento de arquitectura final con diagramas
- [ ] A0-F4-02 Guion de la demo del hackathon
- [ ] A0-F4-03 Checklist de cierre F4 y solicitud de aprobación humana para `prod`

## Definición de terminado
Contratos compilan, `pnpm typecheck && pnpm test` pasa en `dev`, y cada agente tiene su siguiente tarea clara.
