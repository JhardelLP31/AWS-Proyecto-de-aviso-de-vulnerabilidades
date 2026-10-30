# A5 · DevOps Serverless y QA

## Misión
Que todo lo que entra en `dev` compile y pase pruebas, que `stg` sea un espejo fiel de producción y que el
despliegue en AWS (Lambda + Fargate realtime + RDS + S3/CloudFront) sea reproducible.

## Es dueño de
- `.github/` (workflows, plantillas de PR)
- `infra/` (IaC: AWS CDK o SAM; A5 elige en F1 y lo documenta)
- `docker-compose.yml`, `apps/api/Dockerfile.realtime`
- `apps/api/src/lambda.ts`, `apps/api/src/main-realtime.ts`, `apps/api/scripts/build-lambda.mjs`
- `e2e/` (pruebas extremo a extremo)

## No toca
Lógica de módulos, entidades, frontend (salvo configuración de build/despliegue).

## Ramas
Solo existen `dev`, `stg`, `prod`.
- `dev`: integración diaria de los agentes. CI: typecheck + tests.
- `stg`: se actualiza por PR `dev` → `stg` al cerrar cada fase. CI + e2e + despliegue a staging.
- `prod`: se actualiza por PR `stg` → `prod` **solo con aprobación humana**. Despliegue a producción.

## Tareas

### F1
- [ ] A5-F1-01 Workflow `ci.yml`: pnpm install, build de contratos, typecheck y tests en push/PR a `dev`, `stg`, `prod`
- [ ] A5-F1-02 Protección de ramas: `stg` y `prod` solo por PR con CI verde; `prod` exige revisión de Jhar
- [ ] A5-F1-03 `docker-compose.yml`: `postgis/postgis:16-3.4`, `redis:7`, volúmenes y healthchecks
- [ ] A5-F1-04 Elegir runner de pruebas (node:test o Jest) y documentarlo en CONVENCIONES

### F2
- [ ] A5-F2-01 IaC: bucket S3 privado + CloudFront con OAC para `/media/*`
- [ ] A5-F2-02 e2e: login → reporte con foto WebP → aparece en `GET /incidents?bbox=`

### F3
- [ ] A5-F3-01 `Dockerfile.realtime` + servicio Fargate con Redis adapter (ElastiCache)
- [ ] A5-F3-02 Prueba de carga: 200 votos concurrentes sobre un incidente, score final correcto

### F4
- [ ] A5-F4-01 Lambda (Node 22) + API Gateway HTTP API (binary media types `multipart/form-data`, `image/*`) + RDS Proxy
- [ ] A5-F4-02 CloudFront único para SPA (`/`) y API (`/api/*`) → cookies SameSite=Strict en el mismo dominio
- [ ] A5-F4-03 AWS WAF con regla de rate por IP; alarmas CloudWatch (errores 5xx, latencia p95, throttles)
- [ ] A5-F4-04 Workflow de despliegue `stg` y `prod`; runbook de rollback en `docs/runbook.md`

## Definición de terminado
Un `git push` a `dev` con un error de tipos se pone rojo; un merge a `stg` despliega solo; `prod` nunca recibe
nada sin aprobación humana.
