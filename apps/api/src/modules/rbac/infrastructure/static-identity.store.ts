import { Injectable } from '@nestjs/common';
import { hashPassword } from '../../../shared/security/password';
import { AccessProfile, IIdentityStore, LoginCredentials, ROLE_MATRIX } from '../domain/identity';

interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  reputation: number;
  roles: string[];
}

const DEMO_USERS: DemoUser[] = [
  { id: '00000000-0000-4000-8000-000000000001', email: 'vecino@demo.pe', displayName: 'Vecina Castilla', reputation: 1, roles: ['vecino'] },
  { id: '00000000-0000-4000-8000-000000000002', email: 'brigadista@demo.pe', displayName: 'Brigada Catacaos', reputation: 1.5, roles: ['brigadista'] },
  { id: '00000000-0000-4000-8000-000000000003', email: 'coer@demo.pe', displayName: 'COER Piura', reputation: 2, roles: ['defensa_civil'] },
  { id: '00000000-0000-4000-8000-000000000004', email: 'admin@demo.pe', displayName: 'Administrador', reputation: 2, roles: ['admin'] },
];

/** Solo para desarrollo y demo de hackathon (INCIDENTS_DRIVER=mock). Contraseña: DEMO_PASSWORD o "GeoAlert2026!". */
@Injectable()
export class StaticIdentityStore implements IIdentityStore {
  private passwordHash?: Promise<string>;

  async findCredentialsByEmail(email: string): Promise<LoginCredentials | null> {
    const user = DEMO_USERS.find((u) => u.email === email.toLowerCase());
    if (!user) return null;
    this.passwordHash ??= hashPassword(process.env.DEMO_PASSWORD ?? 'GeoAlert2026!');
    return { userId: user.id, passwordHash: await this.passwordHash, isActive: true };
  }

  async loadAccessProfile(userId: string): Promise<AccessProfile | null> {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (!user) return null;
    return {
      userId: user.id,
      displayName: user.displayName,
      reputation: user.reputation,
      roles: user.roles,
      permissions: new Set(user.roles.flatMap((r) => ROLE_MATRIX[r] ?? [])),
    };
  }
}
