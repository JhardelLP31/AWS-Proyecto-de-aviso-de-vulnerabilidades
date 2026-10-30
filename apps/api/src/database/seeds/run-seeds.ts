/**
 * Seed idempotente de RBAC + usuarios demo:  pnpm db:seed
 * Se puede ejecutar N veces: usa ON CONFLICT y nunca borra datos.
 * Usuarios demo solo fuera de producción (o con SEED_DEMO_USERS=true).
 */
import 'reflect-metadata';
import { hashPassword } from '../../common/security/password';
import { env } from '../../config/env';
import { DEMO_USERS } from '../../modules/rbac/types/demo-users';
import { ROLE_MATRIX } from '../../modules/rbac/types/identity.types';
import dataSource from '../data-source';

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  '*': 'Acceso total (administrador)',
  'incidents.*': 'Todas las acciones sobre incidentes',
  'incidents.read': 'Ver incidentes',
  'incidents.create': 'Reportar incidentes',
  'incidents.vote': 'Confirmar o desmentir incidentes',
  'incidents.vote.brigade': 'Insignia de brigadista: el voto suma bonus',
  'incidents.verify': 'Verificar incidentes manualmente',
  'triage.update': 'Cambiar severidad y estado (triaje)',
  'alerts.receive': 'Recibir alertas de despacho en tiempo real',
  'analytics.read': 'Ver analítica',
  'audit.read': 'Consultar la auditoría',
  'users.manage': 'Administrar usuarios',
  'roles.manage': 'Administrar roles y permisos',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  vecino: 'Ciudadano: reporta y valida incidentes cercanos',
  brigadista: 'Brigadista voluntario con insignia',
  defensa_civil: 'Defensa Civil / COER: triaje y despacho',
  admin: 'Administrador de la plataforma',
};

export async function runSeeds(): Promise<void> {
  const db = dataSource.isInitialized ? dataSource : await dataSource.initialize();
  await db.transaction(async (em) => {
    const permissionNames = [...new Set([...Object.keys(PERMISSION_DESCRIPTIONS), ...Object.values(ROLE_MATRIX).flat()])];
    for (const name of permissionNames) {
      await em.query(
        `INSERT INTO permissions (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [name, PERMISSION_DESCRIPTIONS[name] ?? null],
      );
    }

    for (const [role, perms] of Object.entries(ROLE_MATRIX)) {
      await em.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [role, ROLE_DESCRIPTIONS[role] ?? null],
      );
      // La matriz es la fuente de verdad: se sincroniza exactamente (añade y quita).
      await em.query(
        `DELETE FROM role_permissions rp USING roles r, permissions p
          WHERE rp.role_id = r.id AND rp.permission_id = p.id AND r.name = $1 AND NOT (p.name = ANY($2))`,
        [role, perms],
      );
      await em.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = $1 AND p.name = ANY($2)
         ON CONFLICT DO NOTHING`,
        [role, perms],
      );
    }

    if (!env.isProd || process.env.SEED_DEMO_USERS === 'true') {
      const hash = await hashPassword(process.env.DEMO_PASSWORD ?? 'GeoAlert2026!');
      for (const u of DEMO_USERS) {
        await em.query(
          `INSERT INTO users (id, email, password_hash, display_name, reputation)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
          [u.id, u.email, hash, u.displayName, u.reputation],
        );
        await em.query(
          `INSERT INTO user_roles (user_id, role_id)
           SELECT $1, r.id FROM roles r WHERE r.name = ANY($2) ON CONFLICT DO NOTHING`,
          [u.id, u.roles],
        );
      }
    }
  });
}

if (require.main === module) {
  runSeeds()
    .then(async () => {
      console.log('Seeds aplicados.');
      await dataSource.destroy();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
