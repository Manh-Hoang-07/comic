import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';

/**
 * @deprecated Use CacheService instead. This is a compatibility wrapper for RedisUtil.
 */
@Injectable()
export class RedisUtil extends CacheService {
  constructor(configService: ConfigService) {
    super(configService);
  }
}
