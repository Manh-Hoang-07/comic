import { Injectable, Inject, Logger } from '@nestjs/common';
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
} from '@/modules/core/user/domain/user.repository';

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

  private readonly log = new Logger('JwtStrategy');

  async validate(payload: JwtAccessPayload) {
    this.log.warn(`[JWT-DEBUG] validate called, sub=${payload.sub}, email=${payload.email}`);
    const tracker = RequestContext.get<CheckpointTracker>('tracker');
    tracker?.addCheckpoint('jwt_strategy_validate_enter');

    const userId = payload.sub;
    const cacheKey = `user:profile:${userId}`;

    let cachedUser: string | null = null;
    try {
      cachedUser = await this.redis.get(cacheKey);
      this.log.warn(`[JWT-DEBUG] redis: ${cachedUser ? 'HIT' : 'MISS'}`);
    } catch (redisErr: any) {
      this.log.warn(`[JWT-DEBUG] redis ERROR: ${redisErr?.message}`);
    }
    tracker?.addCheckpoint('jwt_strategy_cache_read_end');

    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as Record<string, unknown>;
        // Cache cũ (không có profile): coi như miss → load lại DB + ghi cache đầy đủ
        if ('profile' in parsed) {
          this.log.warn(`[JWT-DEBUG] returning cached user, id=${parsed.id}`);
          return parsed;
        }
        this.log.warn('[JWT-DEBUG] cache HIT but no profile key, falling to DB');
      } catch (_e) {
        this.log.warn('[JWT-DEBUG] cache parse error');
      }
    }

    const user = await this.userRepo.findById(userId);
    tracker?.addCheckpoint('jwt_strategy_db_read_end');
    this.log.warn(`[JWT-DEBUG] DB lookup: ${user ? 'FOUND' : 'NOT FOUND'}`);

    if (!user) {
      return null;
    }

    const userPayload = userEntityToJwtPayload(
      user as unknown as Record<string, unknown>,
    );

    await this.redis.set(cacheKey, JSON.stringify(userPayload), 3600);

    return userPayload;
  }
}
