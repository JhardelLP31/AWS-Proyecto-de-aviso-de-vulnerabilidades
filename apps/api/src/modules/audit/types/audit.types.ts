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
