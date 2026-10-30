import type { DataSourceOptions } from 'typeorm';
import { env } from '../config/env';
import { ENTITIES } from './entities';
import { MIGRATIONS } from './migrations';
import { SnakeNamingStrategy } from './snake-naming.strategy';

/** Opciones compartidas por la app (DatabaseModule) y la CLI de migraciones (data-source.ts). */
export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url: env.databaseUrl,
    ssl: env.databaseSsl ? { rejectUnauthorized: true } : false,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false, // el esquema solo cambia con migraciones revisadas
    migrationsRun: false,
    migrationsTableName: 'typeorm_migrations',
    logging: env.databaseLogging ? ['query', 'error'] : ['error'],
    // Lambda: 1 conexión por contenedor contra RDS Proxy. Contenedor/local: pool normal.
    extra: { max: env.isLambda ? 1 : 10, idleTimeoutMillis: 30_000 },
  };
}
