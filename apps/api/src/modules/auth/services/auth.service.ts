import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { MeDTO } from '@geoalert/contracts';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from '../../../common/security/password';
import { AccessResolver } from '../../rbac/services/access-resolver.service';
import { AccessProfile, IDENTITY_STORE, IIdentityStore } from '../../rbac/types/identity.types';
import { EmailAlreadyRegistered } from '../domain/errors';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';

/** Rol con el que nace toda cuenta autoregistrada. Los demás los concede un administrador. */
const DEFAULT_ROLE = 'vecino';

export const toMe = (p: AccessProfile): MeDTO => ({
  id: p.userId,
  displayName: p.displayName,
  roles: p.roles,
  permissions: [...p.permissions].sort(),
});

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_STORE) private readonly identity: IIdentityStore,
    private readonly access: AccessResolver,
  ) {}

  /** Devuelve el perfil si las credenciales son válidas. Mismo tiempo de respuesta exista o no el email. */
  async authenticate({ email, password }: LoginDto): Promise<AccessProfile> {
    const creds = await this.identity.findCredentialsByEmail(email);
    const ok = await verifyPassword(password, creds?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!creds || !ok || !creds.isActive) throw new UnauthorizedException('Credenciales inválidas');

    this.access.invalidate(creds.userId); // permisos frescos al iniciar sesión
    const profile = await this.access.resolve(creds.userId);
    if (!profile) throw new UnauthorizedException('Credenciales inválidas');
    return profile;
  }

  async register(dto: RegisterDto): Promise<AccessProfile> {
    const userId = await this.identity.createUser({
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      displayName: dto.displayName,
      district: dto.district ?? null,
      phone: dto.phone ?? null,
      roles: [DEFAULT_ROLE],
    });
    if (!userId) throw new EmailAlreadyRegistered('Ese correo ya está registrado');
    const profile = await this.access.resolve(userId);
    if (!profile) throw new Error(`Usuario ${userId} recién creado no encontrado`);
    return profile;
  }
}
