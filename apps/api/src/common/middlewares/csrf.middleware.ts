import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { CSRF_COOKIE, CSRF_HEADER, env, SESSION_COOKIE } from '../../config/env';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Defensa CSRF en profundidad (además de SameSite=Strict):
 *  1. Toda petición mutante con cabecera Origin debe venir del SPA.
 *  2. Si hay sesión, se exige X-CSRF-Token == cookie CSRF (double submit; la cookie es
 *     HttpOnly y el SPA obtiene el valor en el cuerpo del login / GET /auth/csrf).
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.headers.origin;
    if (origin && origin !== env.webOrigin) throw new ForbiddenException('Origen no permitido');

    const hasSession = Boolean(req.cookies?.[SESSION_COOKIE]);
    if (hasSession) {
      const cookie = req.cookies?.[CSRF_COOKIE] as string | undefined;
      const header = req.headers[CSRF_HEADER];
      if (!cookie || typeof header !== 'string' || !safeEqual(cookie, header)) {
        throw new ForbiddenException('Token CSRF inválido');
      }
    }
    next();
  }
}
