/** Perfil de acceso efectivo: lo que el PermissionsGuard adjunta a la request. */
export interface AccessProfile {
  userId: string;
  displayName: string;
  /** w_u del motor de veracidad. */
  reputation: number;
  roles: string[];
  /** Unión de permisos por rol + permisos directos vigentes. */
  permissions: ReadonlySet<string>;
}

export interface LoginCredentials {
  userId: string;
  passwordHash: string;
  isActive: boolean;
}

/**
 * Puerto de identidad. Implementaciones:
 *  - StaticIdentityStore: usuarios demo en memoria (Fase 1, modo mock).
 *  - TypeOrmIdentityStore: tablas users/roles/permissions/user_roles/role_permissions/user_permissions.
 */
export interface NewUser {
  email: string;
  passwordHash: string;
  displayName: string;
  district: string | null;
  phone: string | null;
  roles: string[];
}

export interface IIdentityStore {
  findCredentialsByEmail(email: string): Promise<LoginCredentials | null>;
  loadAccessProfile(userId: string): Promise<AccessProfile | null>;
  /** Devuelve el id creado, o null si el email ya está registrado. */
  createUser(user: NewUser): Promise<string | null>;
}

export const IDENTITY_STORE = Symbol('IDENTITY_STORE');

/** Matriz rol → permisos. Fuente de verdad del seed en ambos modos. */
export const ROLE_MATRIX: Record<string, string[]> = {
  vecino: ['incidents.read', 'incidents.create', 'incidents.vote'],
  brigadista: ['incidents.read', 'incidents.create', 'incidents.vote', 'incidents.vote.brigade'],
  defensa_civil: [
    'incidents.*',
    'triage.update',
    'alerts.receive',
    'analytics.read',
  ],
  admin: ['*'],
};
