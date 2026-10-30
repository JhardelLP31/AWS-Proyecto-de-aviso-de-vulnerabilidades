import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { RoleEntity, UserEntity, UserRoleEntity } from '../entities/rbac.entities';
import { AccessProfile, IIdentityStore, LoginCredentials, NewUser } from '../types/identity.types';

interface AccessRow {
  id: string;
  display_name: string;
  reputation: number;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class TypeOrmIdentityStore implements IIdentityStore {
  constructor(private readonly db: DataSource) {}

  async findCredentialsByEmail(email: string): Promise<LoginCredentials | null> {
    const user = await this.db
      .getRepository(UserEntity)
      .createQueryBuilder('u')
      .select(['u.id', 'u.isActive'])
      .addSelect('u.passwordHash') // columna con select: false
      .where('u.email = :email', { email: email.toLowerCase() })
      .getOne();
    return user && { userId: user.id, passwordHash: user.passwordHash, isActive: user.isActive };
  }

  /** Permisos efectivos (por rol ∪ directos vigentes) en UNA consulta. */
  async loadAccessProfile(userId: string): Promise<AccessProfile | null> {
    const [row] = await this.db.query<AccessRow[]>(
      `SELECT u.id, u.display_name, u.reputation,
              ARRAY(SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                     WHERE ur.user_id = u.id ORDER BY r.name) AS roles,
              ARRAY(SELECT p.name FROM user_roles ur
                      JOIN role_permissions rp ON rp.role_id = ur.role_id
                      JOIN permissions p ON p.id = rp.permission_id
                     WHERE ur.user_id = u.id
                    UNION
                    SELECT p.name FROM user_permissions up
                      JOIN permissions p ON p.id = up.permission_id
                     WHERE up.user_id = u.id AND (up.expires_at IS NULL OR up.expires_at > now())) AS permissions
         FROM users u
        WHERE u.id = $1 AND u.is_active`,
      [userId],
    );
    if (!row) return null;
    return {
      userId: row.id,
      displayName: row.display_name,
      reputation: row.reputation,
      roles: row.roles,
      permissions: new Set(row.permissions),
    };
  }

  async createUser(input: NewUser): Promise<string | null> {
    return this.db.transaction(async (em) => {
      const inserted = await em
        .createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          displayName: input.displayName,
          district: input.district,
          phone: input.phone,
        })
        .orIgnore() // ON CONFLICT DO NOTHING: sin carrera entre "existe?" e "insertar"
        .returning('id')
        .execute();
      const userId = (inserted.raw as Array<{ id: string }>)[0]?.id;
      if (!userId) return null;

      const roles = await em.getRepository(RoleEntity).findBy({ name: In(input.roles) });
      await em.getRepository(UserRoleEntity).insert(roles.map((r) => ({ userId, roleId: r.id })));
      return userId;
    });
  }
}
