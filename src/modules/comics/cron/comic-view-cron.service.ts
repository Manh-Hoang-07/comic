import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IComicRepository,
  COMIC_REPOSITORY,
} from '@/modules/comics/comic/domain/comic.repository';
import { RedisUtil } from '@/core/utils/redis.util';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class ComicViewCronService {
  private readonly logger = new Logger(ComicViewCronService.name);
  private readonly BUFFER_KEY = 'comic:views:buffer';

  constructor(
    @Inject(COMIC_REPOSITORY)
    private readonly comicRepo: IComicRepository,
    private readonly redis: RedisUtil,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncViews() {
    if (!this.redis.isEnabled()) return;

    const lockKey = `${this.BUFFER_KEY}:lock`;
    const lockToken = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const isLocked = await this.redis.lock(lockKey, 280, lockToken);
    if (!isLocked) return;

    try {
      const stuckKeys = await this.redis.scan(`${this.BUFFER_KEY}:syncing:*`);
      for (const key of stuckKeys) {
        this.logger.debug(`Recovering stuck comic sync key: ${key}`);
        await this.processSyncKey(key);
      }

      const workingKey = `${this.BUFFER_KEY}:syncing:${Date.now()}`;

      await this.redis.rename(this.BUFFER_KEY, workingKey);

      await this.processSyncKey(workingKey);
    } catch (error) {
      this.logger.error('Error in comic view cron service:', error);
    } finally {
      await this.redis.unlock(lockKey, lockToken);
    }
  }

  private async processSyncKey(workingKey: string) {
    const data = await this.redis.hgetall(workingKey);
    if (Object.keys(data).length === 0) {
      await this.redis.del(workingKey);
      return;
    }

    const entries = Object.entries(data)
      .map(([comicIdStr, countStr]) => {
        try {
          return {
            comicId: toPrimaryKey(comicIdStr),
            comicIdStr,
            count: parseInt(countStr, 10),
          };
        } catch {
          return null;
        }
      })
      .filter(
        (entry): entry is { comicId: any; comicIdStr: string; count: number } =>
          entry !== null && !isNaN(entry.count) && entry.count > 0,
      );

    if (entries.length === 0) {
      await this.redis.del(workingKey);
      return;
    }

    const CHUNK_SIZE = 100;
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunk = entries.slice(i, i + CHUNK_SIZE);

      try {
        for (const item of chunk) {
          await this.comicRepo.batchIncrementView(item.comicId, item.count);
        }

        const processedFields = chunk.map((item) => item.comicIdStr);
        await this.redis.hdel(workingKey, ...processedFields);
      } catch (error) {
        this.logger.error(`Failed to process chunk in ${workingKey}:`, error);
        return;
      }
    }

    await this.redis.del(workingKey);
    this.logger.log(
      `Successfully synced ${entries.length} comics from ${workingKey}`,
    );
  }
}
