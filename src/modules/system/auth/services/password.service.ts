import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { AttemptLimiterService } from '@/core/security/attempt-limiter.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthOtpService } from './auth-otp.service';

@Injectable()
export class PasswordService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly otpService: AuthOtpService,
    private readonly accountLockoutService: AttemptLimiterService,
    private readonly configService: ConfigService,
    @InjectQueue('notification')
    private readonly notificationQueue: Queue,
  ) {}

  /**
   * Initiate forgot password flow by sending an OTP.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const email = dto.email.toLowerCase();
    const user = await this.userRepo.findOne({ email });

    if (!user) {
      throw new NotFoundException('Email không tồn tại trong hệ thống.');
    }

    await this.otpService.sendForgotPasswordOtp(email);
  }

  /**
   * Reset password using OTP.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const email = dto.email.toLowerCase();

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp.');
    }

    // Verify and consume OTP
    const isValid = await this.otpService.verifyAndDelete(
      'forgot-password',
      email,
      dto.otp,
    );
    if (!isValid) {
      throw new BadRequestException('Mã OTP không chính xác hoặc đã hết hạn.');
    }

    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.userRepo.update(user.id, { password: hashedPassword });

    // Post-reset cleanup
    await this.accountLockoutService.reset('auth:login', email);

    // Queue success notification
    this.queueSuccessNotification(user);
  }

  private queueSuccessNotification(user: any): void {
    const appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    this.notificationQueue
      .add(
        'send_email_template',
        {
          templateCode: 'reset_password_success',
          options: {
            to: user.email!,
            variables: {
              name: user.name || user.username,
              time: new Date().toLocaleString('vi-VN'),
              loginUrl: `${appUrl}/login`,
            },
          },
        },
        {
          jobId: `reset-password-success-${user.id}-${Date.now()}`,
          attempts: 3,
          backoff: 5000,
          removeOnComplete: true,
        },
      )
      .catch((err) =>
        console.error('Failed to queue reset password success email', err),
      );
  }
}
