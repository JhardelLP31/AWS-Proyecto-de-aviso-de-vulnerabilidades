import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { env } from '../../config/env';
import { AccessResolver } from './application/access-resolver.service';
import { IDENTITY_STORE } from './domain/identity';
import { PermissionsGuard } from './presentation/permissions.guard';

@Global()
@Module({
  providers: [
    {
      provide: IDENTITY_STORE,
      // import() dinámico: en modo mock nunca se carga Prisma.
      useFactory: async () =>
        env.incidentsDriver === 'postgres'
          ? new (await import('./infrastructure/prisma-identity.store')).PrismaIdentityStore()
          : new (await import('./infrastructure/static-identity.store')).StaticIdentityStore(),
    },
    AccessResolver,
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [IDENTITY_STORE, AccessResolver],
})
export class RbacModule {}
