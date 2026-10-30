import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Esquema inicial (generado con `migration:generate` y ajustado a mano):
 *  - extensiones PostGIS y uuid-ossp,
 *  - `incidents.location` como columna GENERADA desde lat/lng + índices GiST (total y parcial),
 *  - typeorm_metadata con la base actual (no un nombre fijo) para que funcione en dev/stg/prod.
 */

export class InitSchema1793377114838 implements MigrationInterface {
    name = 'InitSchema1793377114838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const [{ db }] = await queryRunner.query(`SELECT current_database() AS db`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(254) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "display_name" character varying(120) NOT NULL,
                "phone" character varying(20),
                "district" character varying(80),
                "reputation" double precision NOT NULL DEFAULT '1',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "users_email_key" ON "users" ("email")
        `);
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" SERIAL NOT NULL,
                "name" character varying(50) NOT NULL,
                "description" character varying(255),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "roles_name_key" ON "roles" ("name")
        `);
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" SERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "description" character varying(255),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "permissions_name_key" ON "permissions" ("name")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" uuid NOT NULL,
                "role_id" integer NOT NULL,
                "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "granted_by" uuid,
                CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "user_roles_role_id_idx" ON "user_roles" ("role_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" integer NOT NULL,
                "permission_id" integer NOT NULL,
                CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" ("permission_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "user_permissions" (
                "user_id" uuid NOT NULL,
                "permission_id" integer NOT NULL,
                "granted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_a537c48b1f80e8626a71cb56589" PRIMARY KEY ("user_id", "permission_id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "user_permissions_permission_id_idx" ON "user_permissions" ("permission_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" BIGSERIAL NOT NULL,
                "user_id" uuid,
                "action" character varying(80) NOT NULL,
                "resource" character varying(120) NOT NULL,
                "resource_id" character varying(64),
                "ip" character varying(64),
                "user_agent" character varying(512),
                "status_code" integer,
                "changes" jsonb,
                "request_id" character varying(128),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs" ("user_id", "created_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" ("resource", "resource_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."incident_type" AS ENUM(
                'RIVER_OVERFLOW',
                'BLIND_BASIN_COLLAPSE',
                'DIKE_BREACH',
                'ISOLATED_AREA',
                'FLOODED_ROAD',
                'LANDSLIDE',
                'OTHER'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."severity" AS ENUM('GREEN', 'YELLOW', 'ORANGE', 'RED')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."incident_status" AS ENUM('PENDING', 'VERIFIED', 'DISMISSED', 'RESOLVED')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."incident_source" AS ENUM('CITIZEN', 'BRIGADE', 'INDECI_IMPORT')
        `);
        await queryRunner.query(`
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [db,"public","incidents","GENERATED_COLUMN","location","ST_SetSRID(ST_MakePoint(lng, lat), 4326)"]);
        await queryRunner.query(`
            CREATE TABLE "incidents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."incident_type" NOT NULL,
                "severity" "public"."severity" NOT NULL,
                "status" "public"."incident_status" NOT NULL DEFAULT 'PENDING',
                "title" character varying(120) NOT NULL,
                "description" character varying(2000) NOT NULL,
                "lat" double precision NOT NULL,
                "lng" double precision NOT NULL,
                "location" geometry(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
                "district" character varying(80),
                "veracity_score" double precision NOT NULL DEFAULT '0',
                "confirm_count" integer NOT NULL DEFAULT '0',
                "deny_count" integer NOT NULL DEFAULT '0',
                "source" "public"."incident_source" NOT NULL DEFAULT 'CITIZEN',
                "external_ref" character varying(64),
                "reporter_id" uuid,
                "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "verified_at" TIMESTAMP WITH TIME ZONE,
                "resolved_at" TIMESTAMP WITH TIME ZONE,
                "version" integer NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "incidents_lng_range" CHECK (
                    lng BETWEEN -180 AND 180
                ),
                CONSTRAINT "incidents_lat_range" CHECK (
                    lat BETWEEN -90 AND 90
                ),
                CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "incidents_location_gist" ON "incidents" USING GiST ("location")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "incidents_external_ref_key" ON "incidents" ("external_ref")
        `);
        await queryRunner.query(`
            CREATE INDEX "incidents_reporter_id_idx" ON "incidents" ("reporter_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "incidents_occurred_at_idx" ON "incidents" ("occurred_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "incidents_active_location_gist" ON "incidents" USING GiST ("location")
            WHERE status IN ('PENDING', 'VERIFIED')
        `);
        await queryRunner.query(`
            CREATE INDEX "incidents_district_status_idx" ON "incidents" ("district", "status")
        `);
        await queryRunner.query(`
            CREATE INDEX "incidents_status_severity_idx" ON "incidents" ("status", "severity")
        `);
        await queryRunner.query(`
            CREATE TABLE "incident_photos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "incident_id" uuid NOT NULL,
                "storage_key" character varying(255) NOT NULL,
                "mime_type" character varying(30) NOT NULL,
                "width" integer NOT NULL,
                "height" integer NOT NULL,
                "bytes" integer NOT NULL,
                "sha256" character(64) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_e8a2eb0e1bdb4d7e4a5701412cf" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "incident_photos_incident_id_idx" ON "incident_photos" ("incident_id")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."vote_kind" AS ENUM('CONFIRM', 'DENY')
        `);
        await queryRunner.query(`
            CREATE TABLE "incident_confirmations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "incident_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "kind" "public"."vote_kind" NOT NULL,
                "weight" double precision NOT NULL,
                "is_brigade" boolean NOT NULL DEFAULT false,
                "distance_m" double precision NOT NULL,
                "lat" double precision NOT NULL,
                "lng" double precision NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "incident_confirmations_incident_user_key" UNIQUE ("incident_id", "user_id"),
                CONSTRAINT "incident_confirmations_geofence" CHECK (distance_m <= 500),
                CONSTRAINT "PK_56395b752b037493a8fc60b8902" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "incident_confirmations_user_id_idx" ON "incident_confirmations" ("user_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "user_roles"
            ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_roles"
            ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions"
            ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "incidents"
            ADD CONSTRAINT "FK_997933e2e9897cd680e453805ca" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "incident_photos"
            ADD CONSTRAINT "FK_b1645cc61d07f1600569150d24f" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "incident_confirmations"
            ADD CONSTRAINT "FK_ff529ad3606f31f01e8f534c5a1" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "incident_confirmations"
            ADD CONSTRAINT "FK_e100a3fc94d44481384a1b7ceaa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const [{ db }] = await queryRunner.query(`SELECT current_database() AS db`);
        await queryRunner.query(`
            ALTER TABLE "incident_confirmations" DROP CONSTRAINT "FK_e100a3fc94d44481384a1b7ceaa"
        `);
        await queryRunner.query(`
            ALTER TABLE "incident_confirmations" DROP CONSTRAINT "FK_ff529ad3606f31f01e8f534c5a1"
        `);
        await queryRunner.query(`
            ALTER TABLE "incident_photos" DROP CONSTRAINT "FK_b1645cc61d07f1600569150d24f"
        `);
        await queryRunner.query(`
            ALTER TABLE "incidents" DROP CONSTRAINT "FK_997933e2e9897cd680e453805ca"
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incident_confirmations_user_id_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "incident_confirmations"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."vote_kind"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incident_photos_incident_id_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "incident_photos"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_status_severity_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_district_status_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_active_location_gist"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_occurred_at_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_reporter_id_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_external_ref_key"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."incidents_location_gist"
        `);
        await queryRunner.query(`
            DROP TABLE "incidents"
        `);
        await queryRunner.query(`
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "database" = $3
                AND "schema" = $4
                AND "table" = $5
        `, ["GENERATED_COLUMN","location",db,"public","incidents"]);
        await queryRunner.query(`
            DROP TYPE "public"."incident_source"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."incident_status"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."severity"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."incident_type"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."audit_logs_resource_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."audit_logs_user_created_idx"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."audit_logs_created_at_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "audit_logs"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."user_permissions_permission_id_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "user_permissions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."role_permissions_permission_id_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "role_permissions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."user_roles_role_id_idx"
        `);
        await queryRunner.query(`
            DROP TABLE "user_roles"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."permissions_name_key"
        `);
        await queryRunner.query(`
            DROP TABLE "permissions"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."roles_name_key"
        `);
        await queryRunner.query(`
            DROP TABLE "roles"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."users_email_key"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
    }

}
