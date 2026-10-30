import { Inject, Injectable, Logger } from '@nestjs/common';

export interface AuditEntry {
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  statusCode: number;
  changes: { before: unknown; after: unknown } | null;
  requestId: string | null;
  timestamp: Date;
}

/** Puerto de salida: Postgres (AuditLog), SQS → consumidor, o consola en desarrollo. */
export interface IAuditSink {
  write(entry: AuditEntry): Promise<void>;
}
export const AUDIT_SINK = Symbol('AUDIT_SINK');

const REDACTED_KEYS = /pass(word)?|hash|token|secret|cookie|authorization/i;
const MAX_DEPTH = 6;

/** Elimina secretos y recorta estructuras profundas antes de persistir. */
export function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncado]';
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return `[binario ${value.length} bytes]`;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACTED_KEYS.test(k) ? '[redactado]' : sanitize(v, depth + 1);
  }
  return out;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(AUDIT_SINK) private readonly sink: IAuditSink) {}

  /**
   * Nunca lanza: un fallo de auditoría se registra en logs pero no tumba la operación de negocio.
   * Se espera (await) antes de responder porque en Lambda el proceso se congela al devolver la respuesta
   * y una promesa "fire-and-forget" podría perderse. Con el sink SQS la espera es de ~10-20 ms.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.sink.write({
        ...entry,
        changes: entry.changes && {
          before: sanitize(entry.changes.before),
          after: sanitize(entry.changes.after),
        },
      });
    } catch (err) {
      this.logger.error(`No se pudo registrar auditoría ${entry.action}: ${(err as Error).message}`);
    }
  }
}
