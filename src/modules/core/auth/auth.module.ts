import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';

import jwtConfig from '@/core/config/jwt.config';
import googleOAuthConfig from '@/core/config/google-oauth.config';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { AuthOtpService } from './services/auth-otp.service';
import { RegistrationService } from './services/registration.service';
import { PasswordService } from './services/password.service';
import { SocialAuthService } from './services/social-auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

import { RbacModule } from '@/modules/core/rbac/rbac.module';
import { AppMailModule } from '@/core/mail/mail.module';
import { ContentTemplateAdminModule } from '@/modules/core/content-template/admin/content-template.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleOAuthConfig),
    RbacModule,
    AppMailModule,
    ContentTemplateAdminModule,
    BullModule.registerQueue({
      name: 'notification',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '60m') as any,
          issuer: configService.get<string>('jwt.issuer'),
          audience: configService.get<string>('jwt.audience'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    AuthOtpService,
    RegistrationService,
    PasswordService,
    SocialAuthService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule { }
