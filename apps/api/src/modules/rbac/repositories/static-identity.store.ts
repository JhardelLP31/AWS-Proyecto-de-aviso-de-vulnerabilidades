import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../../common/security/password';
import { DEMO_USERS } from '../types/demo-users';
import { AccessProfile, IIdentityStore, LoginCredentials, NewUser, ROLE_MATRIX } from '../types/identity.types';

interface MemoryUser {
  id: string;
  email: string;
  displayName: string;
  reputation: number;
  roles: string[];
  /** null = usa la contraseña demo compartida. */
  passwordHash: string | null;
}

/** Identidad en memoria para DATA_DRIVER=mock. Contraseña demo: DEMO_PASSWORD o "GeoAlert2026!". */
@Injectable()
export class StaticIdentityStore implements IIdentityStore {
  private readonly users: MemoryUser[] = DEMO_USERS.map((u) => ({ ...u, passwordHash: null }));
  private demoHash?: Promise<string>;

  async findCredentialsByEmail(email: string): Promise<LoginCredentials | null> {
    const user = this.users.find((u) => u.email === email.toLowerCase());
    if (!user) return null;
    this.demoHash ??= hashPassword(process.env.DEMO_PASSWORD ?? 'GeoAlert2026!');
    return { userId: user.id, passwordHash: user.passwordHash ?? (await this.demoHash), isActive: true };
  }

  async loadAccessProfile(userId: string): Promise<AccessProfile | null> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    return {
      userId: user.id,
      displayName: user.displayName,
      reputation: user.reputation,
      roles: user.roles,
      permissions: new Set(user.roles.flatMap((r) => ROLE_MATRIX[r] ?? [])),
    };
  }

  async createUser(input: NewUser): Promise<string | null> {
    if (this.users.some((u) => u.email === input.email)) return null;
    const id = randomUUID();
    this.users.push({ id, email: input.email, displayName: input.displayName, reputation: 1, roles: input.roles, passwordHash: input.passwordHash });
    return id;
  }
}
