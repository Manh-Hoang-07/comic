import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/user/domain/user.repository';

/** Payload access JWT sau khi verify (field dùng trong validate). */
type JwtAccessPayload = {
  sub: PrimaryKey;
  email?: string;
  iat?: number;
  exp?: number;
};

/** Chuẩn hóa Prisma (bigint/date) để JSON.stringify/cache + gắn req.user */
function userEntityToJwtPayload(user: Record<string, unknown>): Record<string, unknown> {
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
    const userId = payload.sub;
    const cacheKey = `user:profile:${userId}`;

    const cachedUser = await this.redis.get(cacheKey);

    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as Record<string, unknown>;
        // Cache cũ (không có profile): coi như miss → load lại DB + ghi cache đầy đủ
        if ('profile' in parsed) {
          return parsed;
        }
      } catch (e) {
        // Skip and reload from DB on parse error
      }
    }

    const user = await this.userRepo.findById(userId);

    if (!user) {
      return null;
    }

    const userPayload = userEntityToJwtPayload(user as unknown as Record<string, unknown>);

    await this.redis.set(cacheKey, JSON.stringify(userPayload), 3600);

    return userPayload;
  }
}


