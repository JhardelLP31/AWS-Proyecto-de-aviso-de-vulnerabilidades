import { createParamDecorator, ExecutionContext, SetMetadata, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AccessProfile } from '../domain/identity';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: AccessProfile;
    }
  }
}

export const PERMISSIONS_KEY = 'rbac:permissions';
export const PUBLIC_KEY = 'rbac:public';

/**
 * Exige TODOS los permisos listados (admite comodines en lo concedido: `incidents.*`, `*`).
 *   @RequirePermissions('incidents.verify', 'triage.update')
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/** Ruta accesible sin sesión (login, health, lectura pública del mapa). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Inyecta el perfil de acceso resuelto por el PermissionsGuard. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AccessProfile => {
  const principal = ctx.switchToHttp().getRequest<Request>().principal;
  if (!principal) throw new UnauthorizedException();
  return principal;
});
