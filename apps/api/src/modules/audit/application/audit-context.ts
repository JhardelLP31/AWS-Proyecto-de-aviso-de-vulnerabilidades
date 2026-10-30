import { AsyncLocalStorage } from 'node:async_hooks';

interface AuditStore {
  before?: unknown;
  resourceId?: string;
}

const storage = new AsyncLocalStorage<AuditStore>();

/**
 * Contexto de auditoría por request (AsyncLocalStorage).
 * Los casos de uso registran el estado ANTERIOR de lo que van a modificar;
 * el AuditInterceptor lo combina con la respuesta (estado POSTERIOR).
 * La capa de aplicación no conoce HTTP ni el interceptor.
 */
export const AuditContext = {
  run<T>(fn: () => T): T {
    return storage.run({}, fn);
  },
  recordBefore(resourceId: string, snapshot: unknown): void {
    const store = storage.getStore();
    if (!store || store.before !== undefined) return; // conserva el primer snapshot
    store.resourceId = resourceId;
    store.before = structuredClone(snapshot);
  },
  current(): Readonly<AuditStore> {
    return storage.getStore() ?? {};
  },
};
