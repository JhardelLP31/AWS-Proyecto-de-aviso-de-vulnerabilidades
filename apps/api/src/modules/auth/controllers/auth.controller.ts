import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { MeDTO } from '@geoalert/contracts';
import type { Request, Response } from 'express';
import { Audit, CurrentUser, Public } from '../../../common/decorators';
import { CSRF_COOKIE } from '../../../config/env';
import type { AccessProfile } from '../../rbac/types/identity.types';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService, toMe } from '../services/auth.service';
import { SessionService } from '../services/session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Audit({ action: 'auth.register', resource: 'user' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const profile = await this.auth.register(dto);
    const { csrfToken } = await this.sessions.open(res, profile.userId);
    return { user: toMe(profile), csrfToken };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Audit({ action: 'auth.login', resource: 'session' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const profile = await this.auth.authenticate(dto);
    const { csrfToken } = await this.sessions.open(res, profile.userId);
    return { user: toMe(profile), csrfToken };
  }

  @Post('logout')
  @HttpCode(204)
  @Audit({ action: 'auth.logout', resource: 'session' })
  logout(@Res({ passthrough: true }) res: Response): void {
    this.sessions.close(res);
  }

  @Get('me')
  me(@CurrentUser() user: AccessProfile): MeDTO {
    return toMe(user);
  }

  /** Tras recargar la página el SPA perdió el token CSRF de memoria: lo recupera aquí (GET = sin efectos). */
  @Public()
  @Get('csrf')
  csrf(@Req() req: Request): { csrfToken: string | null } {
    return { csrfToken: (req.cookies?.[CSRF_COOKIE] as string | undefined) ?? null };
  }
}
