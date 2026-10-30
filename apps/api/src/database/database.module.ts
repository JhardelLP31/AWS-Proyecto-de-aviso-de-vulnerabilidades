import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './typeorm.config';

/**
 * Solo se importa con DATA_DRIVER=postgres (ver AppModule). TypeOrmModule expone
 * `DataSource` de forma global; los repositorios lo reciben por inyección.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() })],
})
export class DatabaseModule {}
