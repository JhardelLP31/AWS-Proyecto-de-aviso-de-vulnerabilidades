import 'reflect-metadata';
import { INestApplicationContext, Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { ServerOptions } from 'socket.io';
import { env } from './config/env';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { RealtimeGatewayModule } from './modules/notifications-ws/notifications-ws.module';
import { RbacModule } from './modules/rbac/rbac.module';

/**
 * Servidor realtime dedicado (ECS Fargate / Lightsail / EC2), escalable horizontalmente:
 * el adaptador Redis sincroniza salas entre réplicas y recibe lo que publica Lambda vía emitter.
 * ALB con sticky sessions si se habilita el transporte `polling`.
 */
class RedisIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly redisUrl: string,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    const pub = new Redis(this.redisUrl);
    server.adapter(createAdapter(pub, pub.duplicate()));
    return server;
  }
}

@Module({
  imports: [...(env.dataDriver === 'postgres' ? [DatabaseModule] : []), AuditModule, AuthModule, RbacModule, RealtimeGatewayModule],
})
class RealtimeAppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(RealtimeAppModule);
  app.useWebSocketAdapter(new RedisIoAdapter(app, env.redisUrl));
  await app.listen(env.port);
  Logger.log(`Realtime Socket.io en :${env.port}`, 'Bootstrap');
}

void bootstrap();
