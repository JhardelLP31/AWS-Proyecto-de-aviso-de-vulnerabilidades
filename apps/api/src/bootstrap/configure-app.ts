import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from '../config/env';
import { DomainExceptionFilter } from '../common/filters/domain-exception.filter';

/** Configuración común a main.ts (local/contenedor) y lambda.ts (serverless). */
export function configureApp(app: INestApplication): void {
  const express = app as NestExpressApplication;
  express.set('trust proxy', 1); // API Gateway / CloudFront / ALB → req.ip desde X-Forwarded-For
  express.disable('x-powered-by');

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();

  if (!env.isProd && env.photoDriver === 'local') {
    express.useStaticAssets(env.localPhotoDir, { prefix: '/media', immutable: true, maxAge: '1y' });
  }
}
