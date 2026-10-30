import { Inject, Injectable } from '@nestjs/common';
import { AccessProfile, IDENTITY_STORE, IIdentityStore } from '../domain/identity';

const TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;

/**
 * Resuelve permisos efectivos con caché en memoria por contenedor.
 * En Lambda la caché sobrevive entre invocaciones del mismo contenedor caliente;
 * una revocación tarda como máximo TTL_MS en aplicarse (o llamar a invalidate()).
 */
@Injectable()
export class AccessResolver {
  private readonly cache = new Map<string, { profile: AccessProfile | null; expiresAt: number }>();

  constructor(@Inject(IDENTITY_STORE) private readonly store: IIdentityStore) {}

  async resolve(userId: string): Promise<AccessProfile | null> {
    const now = Date.now();
    const hit = this.cache.get(userId);
    if (hit && hit.expiresAt > now) return hit.profile;

    const profile = await this.store.loadAccessProfile(userId);
    if (this.cache.size >= MAX_ENTRIES) {
      // Map conserva orden de inserción: la primera clave es la más antigua.
      this.cache.delete(this.cache.keys().next().value as string);
    }
    this.cache.set(userId, { profile, expiresAt: now + TTL_MS });
    return profile;
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }
}
