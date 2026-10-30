-- Ajustes PostGIS que Prisma no sabe generar.
-- Flujo: `prisma migrate dev --create-only`, pegar este bloque AL FINAL del
-- migration.sql generado (reemplazando la línea que crea "location") y aplicar.

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Geometría derivada de lat/lng: nunca se desincroniza y Prisma no la escribe.
ALTER TABLE "Incident" DROP COLUMN IF EXISTS "location";
ALTER TABLE "Incident"
  ADD COLUMN "location" geometry(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)) STORED;

CREATE INDEX "Incident_location_gist" ON "Incident" USING GIST ("location");

-- 2. Integridad de dominio que conviene tener también en la base.
ALTER TABLE "Incident"
  ADD CONSTRAINT "Incident_lat_range" CHECK ("lat" BETWEEN -90 AND 90),
  ADD CONSTRAINT "Incident_lng_range" CHECK ("lng" BETWEEN -180 AND 180);

ALTER TABLE "IncidentConfirmation"
  ADD CONSTRAINT "IncidentConfirmation_distance_geofence" CHECK ("distanceM" <= 500);

-- 3. Índice parcial para el mapa en vivo: casi todas las lecturas piden incidentes activos.
CREATE INDEX "Incident_active_location_gist" ON "Incident" USING GIST ("location")
  WHERE "status" IN ('PENDING', 'VERIFIED');

-- 4. AuditLog append-only para el rol de la aplicación (ajusta el nombre del rol).
-- REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM geoalert_app;

-- Consulta de referencia que usa PostgresIncidentRepository.findInBounds:
--   SELECT ... FROM "Incident"
--   WHERE "location" && ST_MakeEnvelope($1, $2, $3, $4, 4326)
--     AND "status" IN ('PENDING','VERIFIED')
--   ORDER BY "severity" DESC, "occurredAt" DESC
--   LIMIT 2000;
