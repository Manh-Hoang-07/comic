import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/user/repositories/user.repository';

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

  async validate(payload: any) {
    const userId = payload.sub;
    const cacheKey = `user:profile:${userId}`;

    // 1. Check Redis cache first
    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {
        // Skip and reload from DB on parse error
      }
    }

    // 2. Load user and admin status if cache miss
    const user = await this.userRepo.findByIdWithBasicInfo(userId);

    if (!user) return null;

    const userProfile = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      email_verified_at: user.email_verified_at,
      phone_verified_at: user.phone_verified_at,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // 3. Store in cache (1h TTL)
    await this.redis.set(cacheKey, JSON.stringify(userProfile), 3600);

    return userProfile;
  }
}


