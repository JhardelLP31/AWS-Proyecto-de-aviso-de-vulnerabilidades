import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../../config/env';
import { SessionService } from './application/session.service';
import { CsrfMiddleware } from './infrastructure/csrf.middleware';
import { AuthController } from './presentation/auth.controller';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: env.jwtSecret,
      signOptions: { algorithm: 'HS256', expiresIn: env.sessionTtlSeconds, issuer: 'geoalert' },
      verifyOptions: { issuer: 'geoalert' },
    }),
  ],
  controllers: [AuthController],
  providers: [SessionService],
  exports: [SessionService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
