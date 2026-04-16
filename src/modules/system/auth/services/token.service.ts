import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { RedisUtil } from '@/core/utils/redis.util';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';

@Injectable()
export class TokenService {
  private readonly DEFAULT_AT_TTL = 3600; // 1h
  private readonly DEFAULT_RT_TTL = 86400; // 1d

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisUtil,
  ) {}

  private parseDurationToSeconds(
    input: string | undefined | null,
    fallback: number,
  ): number {
    if (!input) return fallback;
    const match = /^(\d+)([smhd])?$/.exec(input.trim());
    if (!match) return fallback;
    const val = parseInt(match[1], 10);
    const unit = match[2] || 's';
    switch (unit) {
      case 's':
        return val;
      case 'm':
        return val * 60;
      case 'h':
        return val * 3600;
      case 'd':
        return val * 86400;
      default:
        return fallback;
    }
  }

  getAccessTtlSec(): number {
    const exp = this.config.get<string>('jwt.expiresIn');
    return this.parseDurationToSeconds(exp, this.DEFAULT_AT_TTL);
  }

  getRefreshTtlSec(): number {
    const exp = this.config.get<string>('jwt.refreshExpiresIn');
    return this.parseDurationToSeconds(exp, this.DEFAULT_RT_TTL);
  }

  private getJwtIssuer(): string | undefined {
    return this.config.get<string>('jwt.issuer');
  }
  private getJwtAudience(): string | undefined {
    return this.config.get<string>('jwt.audience');
  }
  private getRefreshSecret(): string {
    return this.config.get<string>('jwt.refreshSecret') as string;
  }

  private generateJti(): string {
    return randomUUID();
  }

  generateTokens(userId: PrimaryKey, email?: string) {
    const payload = { sub: userId, email } as Record<string, unknown>;
    const accessToken = this.jwtService.sign(payload);
    const accessTtlSec = this.getAccessTtlSec();

    const jti = this.generateJti();
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn') || '1d';

    const refreshPayload = { sub: userId, email, jti } as Record<string, unknown>;
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.getRefreshSecret(),
      expiresIn: refreshExpiresIn as any,
      issuer: this.getJwtIssuer(),
      audience: this.getJwtAudience(),
    });

    const refreshTtlSec = this.getRefreshTtlSec();
    return {
      accessToken,
      refreshToken,
      refreshJti: jti,
      accessTtlSec,
      refreshTtlSec,
    } as const;
  }

  verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verify<{
      sub: PrimaryKey;
      jti?: string;
      email?: string;
    }>(refreshToken, {
      secret: this.getRefreshSecret(),
      audience: this.getJwtAudience(),
      issuer: this.getJwtIssuer(),
    });
  }

  decodeRefresh(refreshToken: string) {
    try {
      return this.verifyRefreshToken(refreshToken);
    } catch {
      return null;
    }
  }

  async issueAndStoreNewTokens(userId: PrimaryKey, email?: string) {
    const { accessToken, refreshToken, refreshJti, accessTtlSec } =
      this.generateTokens(userId, email);
    try {
      if (this.redis && this.redis.isEnabled()) {
        const key = this.buildRefreshKey(userId, refreshJti);
        await this.redis.set(key, '1', this.getRefreshTtlSec());
      }
    } catch {
      // intentionally empty
    }
    return { accessToken, refreshToken, accessTtlSec } as const;
  }

  buildRefreshKey(userId: PrimaryKey, jti: string): string {
    return `auth:refresh:${userId}:${jti}`;
  }
}
