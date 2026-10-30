import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const VALID_ID = /^[\w.:=;-]{1,128}$/;

/**
 * Asigna un id de correlación a cada request: reutiliza el de API Gateway / CloudFront
 * (`x-amzn-trace-id`) o el del cliente (`x-request-id`) si es válido; si no, genera uno.
 * Se devuelve en la respuesta y lo usan logs y auditoría.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-amzn-trace-id'] ?? req.headers['x-request-id'];
  const id = typeof incoming === 'string' && VALID_ID.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
