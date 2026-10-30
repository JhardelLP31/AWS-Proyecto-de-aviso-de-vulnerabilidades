import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AccessProfile } from '../../modules/rbac/types/identity.types';
import '../types/express-request';

/** Inyecta el perfil de acceso resuelto por el PermissionsGuard. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AccessProfile => {
  const principal = ctx.switchToHttp().getRequest<Request>().principal;
  if (!principal) throw new UnauthorizedException();
  return principal;
});
