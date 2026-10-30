import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { CsrfMiddleware } from '../middlewares/csrf.middleware';
import { CSRF_COOKIE, CSRF_HEADER, env, SESSION_COOKIE } from '../../config/env';

const mw = new CsrfMiddleware();
const run = (req: Record<string, unknown>) => {
  let passed = false;
  mw.use({ headers: {}, cookies: {}, ...req } as never, {} as never, () => (passed = true));
  return passed;
};

describe('CsrfMiddleware', () => {
  test('GET pasa siempre', () => {
    assert.equal(run({ method: 'GET', headers: { origin: 'https://malo.example' } }), true);
  });

  test('POST desde otro origen se rechaza', () => {
    assert.throws(() => run({ method: 'POST', headers: { origin: 'https://malo.example' } }), ForbiddenException);
  });

  test('POST anónimo del SPA pasa (login/registro)', () => {
    assert.equal(run({ method: 'POST', headers: { origin: env.webOrigin } }), true);
  });

  test('POST con sesión sin token se rechaza', () => {
    assert.throws(
      () => run({ method: 'POST', cookies: { [SESSION_COOKIE]: 'jwt', [CSRF_COOKIE]: 'abc' } }),
      ForbiddenException,
    );
  });

  test('POST con sesión y token distinto se rechaza', () => {
    assert.throws(
      () => run({ method: 'POST', cookies: { [SESSION_COOKIE]: 'jwt', [CSRF_COOKIE]: 'abc' }, headers: { [CSRF_HEADER]: 'xyz' } }),
      ForbiddenException,
    );
  });

  test('POST con sesión y token correcto pasa', () => {
    assert.equal(
      run({ method: 'POST', cookies: { [SESSION_COOKIE]: 'jwt', [CSRF_COOKIE]: 'abc' }, headers: { [CSRF_HEADER]: 'abc' } }),
      true,
    );
  });
});
