import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { randomBytes, randomUUID } from 'node:crypto';
import { CSRF_COOKIE, env, SESSION_COOKIE } from '../../../config/env';

export interface SessionClaims {
  sub: string;
  sid: string;
}

/**
 * Emite y valida la sesión. El JWT nunca toca JavaScript del navegador:
 * viaja solo en una cookie HttpOnly + Secure + SameSite=Strict.
 */
@Injectable()
export class SessionService {
  constructor(private readonly jwt: JwtService) {}

  private cookieBase(): CookieOptions {
    return {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: env.sessionTtlSeconds * 1000,
    };
  }

  /** Abre sesión y devuelve el token CSRF que el SPA guardará solo en memoria. */
  async open(res: Response, userId: string): Promise<{ csrfToken: string }> {
    const token = await this.jwt.signAsync({ sub: userId, sid: randomUUID() } satisfies SessionClaims);
    const csrfToken = randomBytes(32).toString('base64url');
    res.cookie(SESSION_COOKIE, token, this.cookieBase());
    res.cookie(CSRF_COOKIE, csrfToken, this.cookieBase());
    return { csrfToken };
  }

  close(res: Response): void {
    const { maxAge: _ignored, ...opts } = this.cookieBase();
    res.clearCookie(SESSION_COOKIE, opts);
    res.clearCookie(CSRF_COOKIE, opts);
  }

  /** Devuelve los claims o null (expirado, firma inválida, algoritmo inesperado). */
  async verify(token: string | undefined): Promise<SessionClaims | null> {
    if (!token) return null;
    try {
      const claims = await this.jwt.verifyAsync<SessionClaims>(token, { algorithms: ['HS256'] });
      return typeof claims.sub === 'string' ? claims : null;
    } catch {
      return null;
    }
  }
}
