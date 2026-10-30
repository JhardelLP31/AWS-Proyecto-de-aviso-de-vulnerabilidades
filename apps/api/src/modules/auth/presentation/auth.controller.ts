import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { MeDTO } from '@geoalert/contracts';
import type { Request, Response } from 'express';
import { CSRF_COOKIE } from '../../../config/env';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '../../../shared/security/password';
import { Audit } from '../../audit/presentation/audit.decorator';
import { AccessProfile, IDENTITY_STORE, IIdentityStore } from '../../rbac/domain/identity';
import { CurrentUser, Public } from '../../rbac/presentation/rbac.decorators';
import { SessionService } from '../application/session.service';
import { LoginDto } from './dto/login.dto';

const toMe = (p: AccessProfile): MeDTO => ({
  id: p.userId,
  displayName: p.displayName,
  roles: p.roles,
  permissions: [...p.permissions],
});

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IDENTITY_STORE) private readonly identity: IIdentityStore,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Audit({ action: 'auth.login', resource: 'session' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const creds = await this.identity.findCredentialsByEmail(dto.email);
    // Siempre se ejecuta scrypt para no revelar por tiempo si el email existe.
    const ok = await verifyPassword(dto.password, creds?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!creds || !ok || !creds.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const { csrfToken } = await this.sessions.open(res, creds.userId);
    const profile = await this.identity.loadAccessProfile(creds.userId);
    if (!profile) throw new UnauthorizedException('Credenciales inválidas');
    return { user: toMe(profile), csrfToken };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.sessions.close(res);
  }

  @Get('me')
  me(@CurrentUser() user: AccessProfile): MeDTO {
    return toMe(user);
  }

  /** Tras recargar la página el SPA perdió el token CSRF de memoria: lo recupera aquí (GET = sin efectos). */
  @Get('csrf')
  csrf(@Req() req: Request): { csrfToken: string | null } {
    return { csrfToken: (req.cookies?.[CSRF_COOKIE] as string | undefined) ?? null };
  }
}
