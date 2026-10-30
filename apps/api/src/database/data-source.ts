import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config';

/**
 * Punto de entrada de la CLI de TypeORM (sobre el código compilado):
 *   pnpm migration:run | migration:revert | migration:generate --name=<Nombre>
 */
export default new DataSource(buildDataSourceOptions());
