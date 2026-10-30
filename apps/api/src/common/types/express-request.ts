import type { AccessProfile } from '../../modules/rbac/types/identity.types';

// Campos que los middlewares y guards añaden al Request de Express.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Perfil de acceso resuelto por PermissionsGuard (ausente si no hay sesión). */
      principal?: AccessProfile;
      /** Id de correlación asignado por requestIdMiddleware. */
      requestId?: string;
    }
  }
}

export {};
