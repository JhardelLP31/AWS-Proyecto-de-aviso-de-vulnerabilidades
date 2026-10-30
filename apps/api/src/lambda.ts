import 'reflect-metadata';
import serverlessExpress from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import type { Context, Handler } from 'aws-lambda';
import express from 'express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';

/**
 * Entrada AWS Lambda (API Gateway HTTP API v2 o REST v1).
 *
 * Optimización de cold start:
 *  1. El bootstrap se dispara a nivel de módulo → corre durante la fase INIT de Lambda,
 *     que tiene CPU completa y no se factura igual que la invocación.
 *  2. Se cachea la PROMESA (no el resultado): dos invocaciones concurrentes en un
 *     contenedor nuevo nunca inicializan Nest dos veces.
 *  3. Módulos pesados (Prisma, AWS SDK, Redis, motor de analítica) se cargan con import()
 *     solo cuando la configuración o la ruta los necesita.
 *  4. esbuild empaqueta y hace tree-shaking (ver scripts/build-lambda.mjs).
 *
 * Requisitos en API Gateway: binary media types `multipart/form-data` e `image/*`
 * para que las fotos WebP lleguen intactas.
 */
type ProxyHandler = Handler<unknown, unknown>;

async function bootstrap(): Promise<ProxyHandler> {
  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(expressApp), {
    bufferLogs: false,
    abortOnError: false, // en Lambda preferimos que el error suba y la invocación falle con traza
  });
  configureApp(app);
  await app.init();
  return serverlessExpress({ app: expressApp }) as ProxyHandler;
}

let serverPromise: Promise<ProxyHandler> | undefined = bootstrap();

export const handler: Handler = async (event: unknown, context: Context, callback) => {
  // No esperar a que se vacíe el event loop (conexiones Redis/Prisma abiertas a propósito).
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const server = await serverPromise!;
    return await server(event, context, callback);
  } catch (err) {
    serverPromise = bootstrap(); // un INIT fallido no debe envenenar el contenedor para siempre
    throw err;
  }
};
