import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '@geoalert/contracts';
import type { Request } from 'express';
import { SESSION_COOKIE } from '../../config/env';
import { AuditService } from '../../modules/audit/services/audit.service';
import { SessionService } from '../../modules/auth/services/session.service';
import { AccessResolver } from '../../modules/rbac/services/access-resolver.service';
import { PermissionRequirement, PERMISSIONS_KEY, PUBLIC_KEY } from '../decorators';
import '../types/express-request';

/**
 * Guard global (APP_GUARD):
 *  - @Public(): deja pasar, pero si hay cookie válida adjunta el principal igualmente
 *    (útil para personalizar respuestas públicas).
 *  - Sin decorador: exige sesión válida.
 *  - @RequirePermissions(...): exige sesión + TODOS los permisos.
 *  - @RequireAnyPermission(...): exige sesión + AL MENOS UNO.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly access: AccessResolver,
    private readonly audit: AuditService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true; // WebSockets se autentican en handleConnection del gateway.

    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets) ?? false;
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(PERMISSIONS_KEY, targets);

    const req = ctx.switchToHttp().getRequest<Request>();
    const claims = await this.sessions.verify(req.cookies?.[SESSION_COOKIE] as string | undefined);
    const principal = claims ? await this.access.resolve(claims.sub) : null;
    if (principal) req.principal = principal;

    if (isPublic) return true;
    if (!principal) throw new UnauthorizedException('Sesión inválida o expirada');

    if (!requirement) return true;
    const missing = requirement.permissions.filter((p) => !hasPermission(principal.permissions, p));
    const denied = requirement.mode === 'all' ? missing.length > 0 : missing.length === requirement.permissions.length;
    if (denied) {
      // Los guards corren antes que los interceptors: el AuditInterceptor no vería este rechazo.
      await this.audit.record({
        userId: principal.userId,
        action: 'rbac.denied',
        resource: `${req.method} ${req.route?.path ?? req.path}`,
        resourceId: (req.params?.id as string | undefined) ?? null,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
        statusCode: 403,
        changes: { before: null, after: { missing } },
        requestId: req.requestId ?? null,
        timestamp: new Date(),
      });
      throw new ForbiddenException({ message: 'Permisos insuficientes', missing });
    }
    return true;
  }
}
