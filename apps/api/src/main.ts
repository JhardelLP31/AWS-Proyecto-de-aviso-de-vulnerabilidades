import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { env } from './config/env';

/** Arranque local / contenedor. Con REALTIME_DRIVER=inprocess el WebSocket corre en este mismo proceso. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  configureApp(app);
  await app.listen(env.port);
  Logger.log(
    `API en http://localhost:${env.port}/api · data=${env.dataDriver} · realtime=${env.realtimeDriver}`,
    'Bootstrap',
  );
}

void bootstrap();
