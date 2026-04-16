import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { LoginDto } from '@/modules/system/auth/dto/login.dto';
import { RegisterDto } from '@/modules/system/auth/dto/register.dto';
import { ForgotPasswordDto } from '@/modules/system/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/system/auth/dto/reset-password.dto';
import { SendOtpDto } from '../dto/send-otp.dto';
import { RegistrationService } from './registration.service';
import { PasswordService } from './password.service';
import { AuthOtpService } from './auth-otp.service';
import { SocialAuthService } from './social-auth.service';
import { LoginService } from './login.service';
import { safeUser } from '../utils/user.util';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly loginService: LoginService,
    private readonly registrationService: RegistrationService,
    private readonly passwordService: PasswordService,
    private readonly otpService: AuthOtpService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  // ── Session & Credentials ──────────────────────────────────────────────────

  async login(dto: LoginDto) {
    return this.loginService.login(dto);
  }

  async logout(userId: PrimaryKey | null, token?: string) {
    return this.loginService.logout(userId, token);
  }

  async refreshTokenByValue(refreshToken: string) {
    return this.loginService.refreshTokenByValue(refreshToken);
  }

  async me(userId: PrimaryKey) {
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
    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!existing)
      throw new NotFoundException('Email không tồn tại trong hệ thống.');

    await this.otpService.sendForgotPasswordOtp(dto.email);
    return { message: 'Mã OTP đã được gửi đến email của bạn.' };
  }

  async handleGoogleAuth(profile: any) {
    return this.socialAuthService.handleGoogleAuth(profile);
  }
}
