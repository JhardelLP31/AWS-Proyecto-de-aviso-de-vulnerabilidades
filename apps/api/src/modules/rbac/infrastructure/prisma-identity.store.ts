import { Injectable } from '@nestjs/common';
import { getPrisma } from '../../../shared/prisma/prisma.provider';
import { AccessProfile, IIdentityStore, LoginCredentials } from '../domain/identity';

@Injectable()
export class PrismaIdentityStore implements IIdentityStore {
  async findCredentialsByEmail(email: string): Promise<LoginCredentials | null> {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, passwordHash: true, isActive: true },
    });
    return user && { userId: user.id, passwordHash: user.passwordHash, isActive: user.isActive };
  }

  /** Una sola ida a la base: roles → permisos + permisos directos no expirados. */
  async loadAccessProfile(userId: string): Promise<AccessProfile | null> {
    const prisma = await getPrisma();
    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        reputation: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: { name: true, permissions: { select: { permission: { select: { name: true } } } } },
            },
          },
        },
        permissions: {
          where: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          select: { permission: { select: { name: true } } },
        },
      },
    });
    if (!user || !user.isActive) return null;

    const permissions = new Set<string>();
    for (const { role } of user.roles) for (const rp of role.permissions) permissions.add(rp.permission.name);
    for (const up of user.permissions) permissions.add(up.permission.name);

    return {
      userId: user.id,
      displayName: user.displayName,
      reputation: user.reputation,
      roles: user.roles.map((r) => r.role.name),
      permissions,
    };
  }
}
