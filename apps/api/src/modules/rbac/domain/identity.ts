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
 *  - PrismaIdentityStore: tablas User/Role/Permission/RolePermission/UserPermission.
 */
export interface IIdentityStore {
  findCredentialsByEmail(email: string): Promise<LoginCredentials | null>;
  loadAccessProfile(userId: string): Promise<AccessProfile | null>;
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
