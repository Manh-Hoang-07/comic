import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Permission } from '@/common/auth/decorators';
import { RedisUtil } from '@/core/utils/redis.util';

/**
 * Public (không JWT, không secret): xóa toàn bộ key trong Redis DB hiện tại.
 * GET/POST: /api/public/system/cache hoặc .../cache/flush
 * Chỉ dùng môi trường local / không public internet.
 */
@Controller('public/system/cache')
export class PublicCachePurgeController {
  constructor(private readonly redis: RedisUtil) {}

  @Get('flush')
  @HttpCode(HttpStatus.OK)
  @Permission('public')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async flush() {
    if (!this.redis.isEnabled()) {
      return { flushed: false, reason: 'redis_disabled' as const };
    }
    await this.redis.flushDb();
    return { flushed: true as const };
  }
}
