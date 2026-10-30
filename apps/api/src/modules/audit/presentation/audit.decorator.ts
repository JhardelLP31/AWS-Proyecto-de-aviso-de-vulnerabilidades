import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  action: string;
  resource: string;
  /** Parámetro de ruta que identifica el recurso (por defecto `id`). */
  idParam?: string;
}

export const AUDIT_KEY = 'audit:options';

/** Nombra la acción auditada. Sin decorador, el interceptor audita igual toda petición mutante. */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);

/** Excluye un handler mutante de la auditoría (p. ej. telemetría de alto volumen). */
export const SkipAudit = () => SetMetadata(AUDIT_KEY, false);
