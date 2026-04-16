import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { UserStatus } from '@/shared/enums/types/user-status.enum';
import { TokenService } from './token.service';
import { RedisUtil } from '@/core/utils/redis.util';
import { safeUser } from '../utils/user.util';

@Injectable()
export class SocialAuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly redis: RedisUtil,
  ) {}

  /**
   * Handle Google OAuth login/registration.
   * Upserts the user based on email and returns auth tokens.
   */
  async handleGoogleAuth(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }) {
    const email = profile.email.toLowerCase();
    const now = new Date();

    // Find or Create User
    let dbUser = await this.userRepo.findByEmail(email);

    const userData = {
      name: this.resolveFullName(profile),
      image: profile.picture ?? null,
      status: UserStatus.active as any,
      googleId: profile.googleId,
      email_verified_at: now,
      last_login_at: now,
    };

    if (dbUser) {
      dbUser = await this.userRepo.update(dbUser.id, userData);
    } else {
      const username = this.generateUsername(email);
      dbUser = await this.userRepo.create({
        ...userData,
        email,
        username,
      });
    }

    if (dbUser.status !== UserStatus.active) {
      throw new ForbiddenException(
        'Tài khoản đã bị khóa hoặc không hoạt động.',
      );
    }

    // Generate and store response
    const userId = dbUser.id as PrimaryKey;
    const tokens = this.tokenService.generateTokens(userId, dbUser.email!);

    await this.redis
      .set(
        `auth:refresh:${userId}:${tokens.refreshJti}`,
        '1',
        this.tokenService.getRefreshTtlSec(),
      )
      .catch(() => undefined);

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTtlSec,
      user: safeUser(dbUser as any),
    };
  }

  private resolveFullName(profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }): string {
    return (
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      (profile.email ? profile.email.split('@')[0] : '') ||
      'User'
    );
  }

  private generateUsername(email: string): string {
    return email.split('@')[0] + '_' + Date.now().toString().slice(-6);
  }
}
