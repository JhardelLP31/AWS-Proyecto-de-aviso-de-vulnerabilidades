import { Logger } from '@nestjs/common';
import type { AuditEntry, IAuditSink } from '../types/audit.types';

/** DATA_DRIVER=mock: la auditoría va a los logs (CloudWatch en Lambda). */
export class ConsoleAuditSink implements IAuditSink {
  private readonly logger = new Logger('Audit');

  async write(entry: AuditEntry): Promise<void> {
    this.logger.log(JSON.stringify(entry));
  }
}
