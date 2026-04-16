import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { UserStatus } from '@/shared/enums/types/user-status.enum';
import { RedisUtil } from '@/core/utils/redis.util';
import { TokenService } from '@/modules/system/auth/services/token.service';
import { TokenBlacklistService } from '@/core/security/token-blacklist.service';
import { AttemptLimiterService } from '@/core/security/attempt-limiter.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { LoginDto } from '@/modules/system/auth/dto/login.dto';

@Injectable()
export class LoginService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly redis: RedisUtil,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly tokenService: TokenService,
    private readonly accountLockoutService: AttemptLimiterService,
  ) {}

  /**
   * Handle primary email/password login.
   */
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

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      (user as any).password,
    );
    if (!isPasswordValid) {
      await this.accountLockoutService.add(scope, identifier);
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    // 3. Check Account Status
    if (user.status !== UserStatus.active) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa hoặc không hoạt động.',
      );
    }

    // 4. Success Tasks
    await this.accountLockoutService.reset(scope, identifier);
    this.userRepo.updateLastLogin(user.id).catch(() => undefined);

    // 5. Issue Tokens
    const userPk = user.id as PrimaryKey;
    const { accessToken, refreshToken, refreshJti, accessTtlSec } =
      this.tokenService.generateTokens(userPk, user.email!);

    await this.redis
      .set(
        `auth:refresh:${userPk}:${refreshJti}`,
        '1',
        this.tokenService.getRefreshTtlSec(),
      )
      .catch(() => undefined);

    return { token: accessToken, refreshToken, expiresIn: accessTtlSec };
  }

  /**
   * Terminate the session and blacklist the current token.
   */
  async logout(_userId: PrimaryKey | null, token?: string) {
    if (token) {
      const ttlSeconds = this.tokenService.getAccessTtlSec();
      await this.tokenBlacklistService.add(token, ttlSeconds);
    }
    return null;
  }

  /**
   * Refresh the access and refresh tokens.
   */
  async refreshTokenByValue(refreshToken: string) {
    const decoded = this.tokenService.decodeRefresh(refreshToken);
    if (!decoded) throw new UnauthorizedException('Invalid or expired token');

    const userId = decoded.sub as PrimaryKey;
    const jti = decoded.jti as string | undefined;

    if (!userId || !jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshKey = `auth:refresh:${userId}:${jti}`;
    const isActive = await this.redis.get(refreshKey);
    if (!isActive)
      throw new UnauthorizedException('Refresh token revoked or expired');

    await this.redis.del(refreshKey);

    const tokens = await this.tokenService.issueAndStoreNewTokens(
      userId,
      decoded.email,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTtlSec,
    };
  }
}
