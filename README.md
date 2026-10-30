# GeoAlert / ResQMap

Plataforma colaborativa en tiempo real para reportar, validar y despachar emergencias climáticas en Piura
(Fenómeno El Niño): desbordes de ríos, cuencas ciegas colapsadas, rotura de diques y zonas aisladas.

- **Backend**: NestJS (DDD + Clean Architecture) sobre AWS Lambda, PostgreSQL + PostGIS, Socket.io.
- **Frontend**: Vue 3 + Pinia + Leaflet, captura de fotos comprimidas a WebP en el navegador.
- **Equipo**: lo construyen agentes IA con roles separados → empieza por [`AGENTS.md`](AGENTS.md).

## Documentación

| Documento | Para qué |
|---|---|
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases, quién hace qué y estrategia de migración del dataset |
| [docs/agentes/README.md](docs/agentes/README.md) | Roles de los agentes y carpetas de cada uno |
| [docs/agentes/CONVENCIONES.md](docs/agentes/CONVENCIONES.md) | Estructura de módulos, TypeORM, validación |
| [docs/avances/](docs/avances/) | Avance de cada agente |

## Ramas

Solo `dev` (integración), `stg` (pre-producción) y `prod` (producción). Ver [A5](docs/agentes/A5-devops-qa.md).

## Arranque local (modo mock, sin base de datos)

```bash
pnpm install
pnpm --filter @geoalert/contracts build
cd apps/api && cp .env.example .env && pnpm build && pnpm start
# API en http://localhost:3000/api  ·  usuarios demo: vecino@demo.pe, brigadista@demo.pe, coer@demo.pe, admin@demo.pe
# contraseña demo: GeoAlert2026!
```
