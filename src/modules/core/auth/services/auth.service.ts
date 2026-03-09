import { Injectable, Inject, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserStatus } from '@/shared/enums/types/user-status.enum';
import { RedisUtil } from '@/core/utils/redis.util';
import { TokenService } from '@/modules/core/auth/services/token.service';
import { TokenBlacklistService } from '@/core/security/token-blacklist.service';
import { AttemptLimiterService } from '@/core/security/attempt-limiter.service';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { LoginDto } from '@/modules/core/auth/dto/login.dto';
import { RegisterDto } from '@/modules/core/auth/dto/register.dto';
import { ForgotPasswordDto } from '@/modules/core/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/core/auth/dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { RegistrationService } from './registration.service';
import { PasswordService } from './password.service';
import { AuthOtpService } from './auth-otp.service';
import { SocialAuthService } from './social-auth.service';
import { safeUser } from '../utils/user.util';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly redis: RedisUtil,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly tokenService: TokenService,
    private readonly accountLockoutService: AttemptLimiterService,
    private readonly registrationService: RegistrationService,
    private readonly passwordService: PasswordService,
    private readonly otpService: AuthOtpService,
    private readonly socialAuthService: SocialAuthService,
  ) { }

  // ── Authentication ─────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const identifier = dto.email.toLowerCase();
    const scope = 'auth:login';

    // 1. Check Lockout
    const lockout = await this.accountLockoutService.check(scope, identifier);
    if (lockout.isLocked) {
      throw new ForbiddenException(
        `Tài khoản đã bị khóa tạm thời do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${lockout.remainingMinutes} phút.`,
      );
    }

    // 2. Validate Credentials
    const user = await this.userRepo.findByEmailForAuth(identifier);
    if (!user || !(user as any).password) {
      await this.accountLockoutService.add(scope, identifier);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, (user as any).password);
    if (!isPasswordValid) {
      await this.accountLockoutService.add(scope, identifier);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    // 3. Check Account Status
    if (user.status !== UserStatus.active) {
      throw new ForbiddenException('Tài khoản đã bị khóa hoặc không hoạt động.');
    }

    // 4. Success Tasks
    await this.accountLockoutService.reset(scope, identifier);
    this.userRepo.updateLastLogin(user.id).catch(() => undefined);

    // 5. Issue Tokens
    const numericUserId = Number(user.id);
    const { accessToken, refreshToken, refreshJti, accessTtlSec } =
      this.tokenService.generateTokens(numericUserId, user.email!);

    await this.redis
      .set(
        `auth:refresh:${numericUserId}:${refreshJti}`,
        '1',
        this.tokenService.getRefreshTtlSec(),
      )
      .catch(() => undefined);

    return { token: accessToken, refreshToken, expiresIn: accessTtlSec };
  }

  async logout(userId: number, token?: string) {
    if (token) {
      const ttlSeconds = this.tokenService.getAccessTtlSec();
      await this.tokenBlacklistService.add(token, ttlSeconds);
    }
    return null;
  }

  async refreshTokenByValue(refreshToken: string) {
    const decoded = this.tokenService.decodeRefresh(refreshToken);
    if (!decoded) throw new UnauthorizedException('Invalid or expired token');

    const userId = Number(decoded.sub);
    const jti = decoded.jti as string | undefined;

    if (!userId || !jti || isNaN(userId)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshKey = `auth:refresh:${userId}:${jti}`;
    const isActive = await this.redis.get(refreshKey);
    if (!isActive) throw new UnauthorizedException('Refresh token revoked or expired');

    await this.redis.del(refreshKey);

    const tokens = await this.tokenService.issueAndStoreNewTokens(
      userId,
      (decoded as any).email as string | undefined,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTtlSec,
    };
  }

  async me(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return safeUser(user);
  }

  // ── Delegated Flows (Forwarders) ───────────────────────────────────────────

  async register(dto: RegisterDto) {
    return this.registrationService.register(dto);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
  }

  async sendOtpForRegister(dto: SendOtpDto) {
    // Basic check before sending OTP
    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (existing) throw new BadRequestException('Email đã được sử dụng.');

    await this.otpService.sendRegisterOtp(dto.email);
    return { message: 'Mã OTP đã được gửi đến email của bạn.' };
  }

  async sendOtpForForgotPassword(dto: SendOtpDto) {
    await this.otpService.sendForgotPasswordOtp(dto.email);
    return { message: 'Mã OTP đã được gửi đến email của bạn.' };
  }

  async handleGoogleAuth(profile: any) {
    return this.socialAuthService.handleGoogleAuth(profile);
  }
}
