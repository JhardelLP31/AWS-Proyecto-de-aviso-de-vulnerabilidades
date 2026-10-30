import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Public, RequireAnyPermission, RequirePermissions } from '../decorators';
import type { AccessProfile } from '../../modules/rbac/types/identity.types';

const profile = (permissions: string[]): AccessProfile => ({
  userId: 'u1',
  displayName: 'Test',
  reputation: 1,
  roles: [],
  permissions: new Set(permissions),
});

class Ctrl {
  open() {}
  any() {}
  all() {}
  authOnly() {}
}
Public()(Ctrl.prototype, 'open', Object.getOwnPropertyDescriptor(Ctrl.prototype, 'open')!);
RequireAnyPermission('triage.update', 'incidents.verify')(Ctrl.prototype, 'any', Object.getOwnPropertyDescriptor(Ctrl.prototype, 'any')!);
RequirePermissions('incidents.verify', 'triage.update')(Ctrl.prototype, 'all', Object.getOwnPropertyDescriptor(Ctrl.prototype, 'all')!);

function setup(user: AccessProfile | null) {
  const audited: unknown[] = [];
  const guard = new PermissionsGuard(
    new Reflector(),
    { verify: async (t?: string) => (t ? { sub: 'u1', sid: 's' } : null) } as never,
    { resolve: async () => user } as never,
    { record: async (e: unknown) => void audited.push(e) } as never,
  );
  const ctx = (handler: keyof Ctrl, withCookie = true) => {
    const req = { cookies: withCookie ? { ga_session: 'jwt' } : {}, method: 'POST', path: '/x', params: {}, headers: {} };
    return {
      ctx: {
        getType: () => 'http',
        getHandler: () => Ctrl.prototype[handler],
        getClass: () => Ctrl,
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext,
      req,
    };
  };
  return { guard, ctx, audited };
}

describe('PermissionsGuard', () => {
  test('@Public deja pasar sin sesión', async () => {
    const { guard, ctx } = setup(null);
    assert.equal(await guard.canActivate(ctx('open', false).ctx), true);
  });

  test('@Public adjunta el principal si hay sesión', async () => {
    const { guard, ctx } = setup(profile([]));
    const { ctx: c, req } = ctx('open');
    await guard.canActivate(c);
    assert.equal((req as { principal?: AccessProfile }).principal?.userId, 'u1');
  });

  test('sin decorador exige sesión', async () => {
    const { guard, ctx } = setup(null);
    await assert.rejects(guard.canActivate(ctx('authOnly', false).ctx), UnauthorizedException);
  });

  test('RequirePermissions exige todos y audita el rechazo', async () => {
    const { guard, ctx, audited } = setup(profile(['incidents.verify']));
    await assert.rejects(guard.canActivate(ctx('all').ctx), ForbiddenException);
    assert.equal(audited.length, 1);
  });

  test('comodín incidents.* cubre incidents.verify', async () => {
    const { guard, ctx } = setup(profile(['incidents.*', 'triage.update']));
    assert.equal(await guard.canActivate(ctx('all').ctx), true);
  });

  test('RequireAnyPermission basta con uno', async () => {
    const { guard, ctx } = setup(profile(['triage.update']));
    assert.equal(await guard.canActivate(ctx('any').ctx), true);
  });

  test('* concede todo', async () => {
    const { guard, ctx } = setup(profile(['*']));
    assert.equal(await guard.canActivate(ctx('all').ctx), true);
  });
});
