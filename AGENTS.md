# Instrucciones para agentes IA — GeoAlert / ResQMap

Este repositorio lo construye un equipo de agentes IA, cada uno con un rol y unas carpetas propias.
Antes de escribir una sola línea:

1. Identifica tu rol (te lo indica quien te lanza: `A0` … `A5`).
2. Lee tu ficha en [`docs/agentes/`](docs/agentes/README.md) y respeta **solo** las rutas que te pertenecen.
3. Lee tu archivo de avance en [`docs/avances/`](docs/avances/) y continúa desde la primera tarea sin marcar.
4. Lee [`docs/ROADMAP.md`](docs/ROADMAP.md) para saber en qué fase estamos y de quién dependes.
5. Lee las convenciones de código en [`docs/agentes/CONVENCIONES.md`](docs/agentes/CONVENCIONES.md).

## Reglas que no se negocian

- **Ramas**: solo existen `dev`, `stg` y `prod`. Trabajas sobre `dev`. Nunca hagas push a `stg` ni a `prod`.
  Si necesitas una rama temporal (`tmp/A2-migraciones`), bórrala en cuanto se integre en `dev`.
- **Propiedad de carpetas**: si necesitas un cambio en una carpeta ajena, no lo hagas; escríbelo en la sección
  *Solicitudes a otros agentes* de tu archivo de avance y en la del agente dueño.
- **Contratos** (`packages/contracts`): solo los modifica `A0`. Pide el cambio por escrito.
- **Cada commit** actualiza tu archivo de avance (tarea marcada + entrada en la bitácora).
- **Mensaje de commit**: `[A2] feat(datos): entidad Incident con columna PostGIS`.
- **Antes de hacer push**: `pnpm typecheck && pnpm test` deben pasar. Si no pasan, no subas.
- **Secretos**: nunca en el repositorio. Usa `.env` (ignorado) y `.env.example` con valores falsos.
- **Idioma**: código y nombres en inglés; comentarios, documentación y mensajes al usuario en español.
