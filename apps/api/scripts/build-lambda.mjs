// Empaqueta la API en un único archivo tree-shaken para AWS Lambda (Node 22).
// Paso 1 (`tsc`): compila con emitDecoratorMetadata, que Nest necesita y esbuild no genera.
// Paso 2 (este script): esbuild empaqueta el JS compilado y elimina código muerto.
import { build } from 'esbuild';

await build({
  entryPoints: ['dist/src/lambda.js'],
  outfile: 'dist/lambda/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  minify: true,
  keepNames: true, // Nest usa nombres de clase para tokens y logs
  sourcemap: 'linked',
  treeShaking: true,
  external: [
    // Dependencias opcionales que Nest resuelve dinámicamente y no usamos.
    '@nestjs/microservices',
    '@nestjs/microservices/*',
    '@nestjs/platform-socket.io', // en Lambda no hay servidor WebSocket (REALTIME_DRIVER=redis)
    '@fastify/static',
    'class-transformer/storage',
    // Drivers opcionales de TypeORM que no usamos (solo PostgreSQL vía `pg`).
    'mysql',
    'mysql2',
    'sqlite3',
    'better-sqlite3',
    'sql.js',
    'oracledb',
    'mssql',
    'mongodb',
    'hdb-pool',
    '@sap/hana-client',
    '@sap/hana-client/extension/Stream',
    'typeorm-aurora-data-api-driver',
    'react-native-sqlite-storage',
    '@google-cloud/spanner',
    'pg-native',
    'pg-query-stream',
    'redis',
    // El runtime de Lambda ya incluye AWS SDK v3.
    '@aws-sdk/*',
  ],
  logLevel: 'info',
});
