import type { PrismaService } from './prisma.service';

let client: Promise<PrismaService> | undefined;

/**
 * Carga perezosa de Prisma: en modo `mock` el motor nunca se importa,
 * lo que recorta ~150 ms del cold start de Lambda.
 */
export function getPrisma(): Promise<PrismaService> {
  client ??= import('./prisma.service').then(({ PrismaService }) => new PrismaService());
  return client;
}
