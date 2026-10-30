import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Sin $connect() en onModuleInit: Prisma conecta en la primera consulta.
 * Así un cold start de Lambda que solo sirve /health no abre conexión a RDS.
 * En Lambda usar RDS Proxy (DATABASE_URL apuntando al proxy, connection_limit=1).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
