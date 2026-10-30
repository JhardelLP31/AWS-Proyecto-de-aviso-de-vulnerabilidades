import type { NextFunction, Request, Response } from 'express';
import { AuditContext } from '../../modules/audit/services/audit-context';

/** Abre el AsyncLocalStorage antes de guards/interceptors para que todo el request comparta contexto. */
export function auditContextMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  AuditContext.run(next);
}
