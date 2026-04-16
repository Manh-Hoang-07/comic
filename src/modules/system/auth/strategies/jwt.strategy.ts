import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';
import { RequestContext } from '@/common/shared/utils';
import { CheckpointTracker } from '@/core/logger/checkpoint-tracker';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';

/** Payload access JWT sau khi verify (field dùng trong validate). */
type JwtAccessPayload = {
  sub: PrimaryKey;
  email?: string;
  iat?: number;
  exp?: number;
};

/** Chuẩn hóa Prisma (bigint/date) để JSON.stringify/cache + gắn req.user */
function userEntityToJwtPayload(
  user: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(user, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly redis: RedisUtil,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  async validate(payload: JwtAccessPayload) {
    const tracker = RequestContext.get<CheckpointTracker>('tracker');
    tracker?.addCheckpoint('jwt_strategy_validate_enter');

    const userId = payload.sub;
    const cacheKey = `user:profile:${userId}`;

    let cachedUser: string | null = null;
    try {
      cachedUser = await this.redis.get(cacheKey);
    } catch {
      // Redis unavailable, fall through to DB
    }
    tracker?.addCheckpoint('jwt_strategy_cache_read_end');

    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as Record<string, unknown>;
        if ('profile' in parsed && parsed.id === String(userId)) {
          if (parsed.status !== 'active') return null;
          return parsed;
        }
      } catch {
        // Cache parse error, fall through to DB
      }
    }

    const user = await this.userRepo.findById(userId);
    tracker?.addCheckpoint('jwt_strategy_db_read_end');

    if (!user) {
      return null;
    }

    const raw = user as unknown as Record<string, unknown>;
    if (raw.status !== 'active') return null;

    const userPayload = userEntityToJwtPayload(raw);

    await this.redis.set(cacheKey, JSON.stringify(userPayload), 3600);

    return userPayload;
  }
}
