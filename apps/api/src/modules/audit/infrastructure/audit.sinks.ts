import { Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { getPrisma } from '../../../shared/prisma/prisma.provider';
import type { AuditEntry, IAuditSink } from '../application/audit.service';

export class ConsoleAuditSink implements IAuditSink {
  private readonly logger = new Logger('Audit');

  async write(entry: AuditEntry): Promise<void> {
    this.logger.log(JSON.stringify(entry));
  }
}

export class PrismaAuditSink implements IAuditSink {
  async write(e: AuditEntry): Promise<void> {
    const prisma = await getPrisma();
    await prisma.auditLog.create({
      data: {
        userId: e.userId,
        action: e.action,
        resource: e.resource,
        resourceId: e.resourceId,
        ip: e.ip,
        userAgent: e.userAgent?.slice(0, 512) ?? null,
        statusCode: e.statusCode,
        changes: (e.changes ?? undefined) as Prisma.InputJsonValue | undefined,
        requestId: e.requestId,
        createdAt: e.timestamp,
      },
    });
  }
}

// En producción serverless se recomienda un SqsAuditSink (SendMessage) + una Lambda consumidora
// que escriba en AuditLog por lotes: desacopla la latencia de la base y absorbe picos de tráfico.
