import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { from, Observable, throwError } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { DomainError, httpStatusFor } from '../errors/domain-error';
import { AuditContext } from '../../modules/audit/services/audit-context';
import { AuditService } from '../../modules/audit/services/audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import '../types/express-request';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Interceptor global de auditoría forense.
 * Registra quién (userId, ip, userAgent), qué (action, resource, resourceId),
 * cuándo y cómo cambió (before vía AuditContext / after = respuesta).
 * También registra intentos fallidos dentro del handler (403 de dominio, 409, 422…), que son los más
 * valiosos en un análisis forense. Los 403 de RBAC los registra el PermissionsGuard, que corre antes.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') return next.handle();

    const req = ctx.switchToHttp().getRequest<Request>();
    const meta = this.reflector.get<AuditOptions | false | undefined>(AUDIT_KEY, ctx.getHandler());
    if (meta === false || (!meta && !MUTATING.has(req.method))) return next.handle();

    const options: AuditOptions = meta || {
      action: `${ctx.getClass().name.replace(/Controller$/, '').toLowerCase()}.${ctx.getHandler().name}`,
      resource: ctx.getClass().name.replace(/Controller$/, '').toLowerCase(),
    };

    const write = (statusCode: number, after: unknown) => {
      const store = AuditContext.current();
      const idParam = req.params?.[options.idParam ?? 'id'];
      return this.audit.record({
        userId: req.principal?.userId ?? null,
        action: options.action,
        resource: options.resource,
        resourceId: store.resourceId ?? idParam ?? extractId(after),
        ip: req.ip ?? null, // con `trust proxy` configurado, Express toma X-Forwarded-For
        userAgent: req.headers['user-agent'] ?? null,
        statusCode,
        changes: { before: store.before ?? null, after },
        requestId: req.requestId ?? null,
        timestamp: new Date(),
      });
    };

    return next.handle().pipe(
      concatMap((body) =>
        from(write(ctx.switchToHttp().getResponse<Response>().statusCode, body)).pipe(map(() => body)),
      ),
      catchError((err: unknown) => {
        const status =
          err instanceof HttpException ? err.getStatus() : err instanceof DomainError ? httpStatusFor(err) : 500;
        const detail =
          err instanceof HttpException
            ? err.getResponse()
            : err instanceof DomainError
              ? { code: err.code, message: err.message, details: err.details }
              : { message: 'Error interno' };
        return from(write(status, { error: detail })).pipe(concatMap(() => throwError(() => err)));
      }),
    );
  }
}

function extractId(body: unknown): string | null {
  if (body && typeof body === 'object' && 'id' in body && typeof (body as { id: unknown }).id === 'string') {
    return (body as { id: string }).id;
  }
  return null;
}
