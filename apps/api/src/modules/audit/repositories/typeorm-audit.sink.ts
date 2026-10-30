import type { DataSource } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import type { AuditEntry, IAuditSink } from '../types/audit.types';

// En producción serverless conviene un SqsAuditSink + consumidor por lotes; esta
// implementación directa es la de F1 y sirve para contenedores y desarrollo.
export class TypeOrmAuditSink implements IAuditSink {
  constructor(private readonly db: DataSource) {}

  async write(e: AuditEntry): Promise<void> {
    const row: QueryDeepPartialEntity<AuditLogEntity> = {
      userId: e.userId,
      action: e.action,
      resource: e.resource,
      resourceId: e.resourceId,
      ip: e.ip,
      userAgent: e.userAgent?.slice(0, 512) ?? null,
      statusCode: e.statusCode,
      changes: e.changes,
      requestId: e.requestId,
      createdAt: e.timestamp,
    } as QueryDeepPartialEntity<AuditLogEntity>; // `changes` es JSON libre (unknown): TypeORM no puede tiparlo en profundidad
    await this.db.getRepository(AuditLogEntity).insert(row);
  }
}
