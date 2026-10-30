import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission } from '@geoalert/contracts';
import type { Request } from 'express';
import { SESSION_COOKIE } from '../../../config/env';
import { AuditService } from '../../audit/application/audit.service';
import { SessionService } from '../../auth/application/session.service';
import { AccessResolver } from '../application/access-resolver.service';
import { PERMISSIONS_KEY, PUBLIC_KEY } from './rbac.decorators';

/**
 * Guard global (APP_GUARD):
 *  - @Public(): deja pasar, pero si hay cookie válida adjunta el principal igualmente
 *    (útil para personalizar respuestas públicas).
 *  - Sin decorador: exige sesión válida.
 *  - @RequirePermissions(...): exige sesión + todos los permisos.
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
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, targets) ?? [];

    const req = ctx.switchToHttp().getRequest<Request>();
    const claims = await this.sessions.verify(req.cookies?.[SESSION_COOKIE] as string | undefined);
    const principal = claims ? await this.access.resolve(claims.sub) : null;
    if (principal) req.principal = principal;

    if (isPublic) return true;
    if (!principal) throw new UnauthorizedException('Sesión inválida o expirada');

    const missing = required.filter((p) => !hasPermission(principal.permissions, p));
    if (missing.length > 0) {
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
        requestId: (req.headers['x-amzn-trace-id'] as string | undefined) ?? null,
        timestamp: new Date(),
      });
      throw new ForbiddenException({ message: 'Permisos insuficientes', missing });
    }
    return true;
  }
}
