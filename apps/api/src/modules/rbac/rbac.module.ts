import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { env } from '../../config/env';
import { StaticIdentityStore } from './repositories/static-identity.store';
import { TypeOrmIdentityStore } from './repositories/typeorm-identity.store';
import { AccessResolver } from './services/access-resolver.service';
import { IDENTITY_STORE, IIdentityStore } from './types/identity.types';

@Global()
@Module({
  providers: [
    {
      provide: IDENTITY_STORE,
      // DataSource solo existe con DATA_DRIVER=postgres (DatabaseModule); en mock se inyecta undefined.
      inject: [{ token: DataSource, optional: true }],
      useFactory: (db?: DataSource): IIdentityStore =>
        env.dataDriver === 'postgres' && db ? new TypeOrmIdentityStore(db) : new StaticIdentityStore(),
    },
    AccessResolver,
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [IDENTITY_STORE, AccessResolver],
})
export class RbacModule {}
