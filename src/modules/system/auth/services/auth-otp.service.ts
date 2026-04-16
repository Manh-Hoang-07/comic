import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';
import { ContentTemplateExecutionService } from '@/modules/system/content-template/services/content-template-execution.service';
import { generateOtp, buildOtpKey } from '../utils/otp.helper';

const DEFAULT_OTP_TTL_SEC = 300; // 5 minutes

@Injectable()
export class AuthOtpService {
  constructor(
    private readonly redis: RedisUtil,
    private readonly contentTemplateService: ContentTemplateExecutionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send an OTP via email for registration.
   */
  async sendRegisterOtp(email: string): Promise<void> {
    const otp = generateOtp();
    const key = buildOtpKey('register', email);

    await this.redis.set(key, otp, DEFAULT_OTP_TTL_SEC);

    await this.contentTemplateService.execute('send_otp_register', {
      to: email,
      variables: { otp },
    });
  }

  /**
   * Send an OTP via email for forgot password flow.
   */
  async sendForgotPasswordOtp(email: string): Promise<void> {
    const otp = generateOtp();
    const key = buildOtpKey('forgot-password', email);

    await this.redis.set(key, otp, DEFAULT_OTP_TTL_SEC);

    await this.contentTemplateService.execute('send_otp_forgot_password', {
      to: email,
      variables: { otp },
    });
  }

  /**
   * Verify an OTP and delete it if valid.
   */
  async verifyAndDelete(
    type: string,
    email: string,
    providedOtp: string,
  ): Promise<boolean> {
    const key = buildOtpKey(type, email);
    const cached = await this.redis.get(key);

    if (!cached) return false;

    // Direct check + Dev bypass
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isValid =
      providedOtp === cached ||
      (nodeEnv === 'development' && providedOtp === '123456');

    if (isValid) {
      await this.redis.del(key);
      return true;
    }

    return false;
  }
}
