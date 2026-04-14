import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        let redisUrl = configService.get<string>('REDIS_URL');

        // Force override on Vercel if user misconfigured a local connection
        if (
          process.env.VERCEL &&
          (!redisUrl ||
            redisUrl.includes('localhost') ||
            redisUrl.includes('127.0.0.1'))
        ) {
          redisUrl =
            'rediss://default:gQAAAAAAAVCsAAIncDExNzAzNDU4MTc3Mjg0ZmYxOTc1YWViNDk5MzljOTU2NHAxODYxODg@crack-monitor-86188.upstash.io:6379';
        }

        if (redisUrl) {
          const globalBullRedisClients: Record<string, any> =
            (global as any)._bullRedisClients || {};
          (global as any)._bullRedisClients = globalBullRedisClients;

          return {
            createClient: (type: string) => {
              if (!globalBullRedisClients[type]) {
                globalBullRedisClients[type] = new Redis(redisUrl, {
                  maxRetriesPerRequest: type === 'client' ? 1 : null,
                  enableReadyCheck: false,
                  ...(redisUrl.startsWith('rediss://')
                    ? { tls: { rejectUnauthorized: false } }
                    : {}),
                });
              }
              return globalBullRedisClients[type];
            },
          };
        }

        // Fallback local connect (Local Development)
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notification',
      limiter: {
        max: 10,
        duration: 1000,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  exports: [BullModule],
})
export class AppQueueModule {}
