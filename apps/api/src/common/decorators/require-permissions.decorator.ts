import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'rbac:permissions';

export interface PermissionRequirement {
  mode: 'all' | 'any';
  permissions: string[];
}

/**
 * Exige TODOS los permisos listados (lo concedido admite comodines: `incidents.*`, `*`).
 *   @RequirePermissions('incidents.verify', 'triage.update')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata<string, PermissionRequirement>(PERMISSIONS_KEY, { mode: 'all', permissions });

/** Exige AL MENOS UNO de los permisos listados. */
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata<string, PermissionRequirement>(PERMISSIONS_KEY, { mode: 'any', permissions });
