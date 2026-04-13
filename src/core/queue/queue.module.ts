import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL');

                if (redisUrl) {
                    // Use createClient to cleanly delegate string parsing to ioredis natively
                    return {
                        createClient: () => {
                            // eslint-disable-next-line @typescript-eslint/no-var-requires
                            const Redis = require('ioredis');
                            return new Redis(redisUrl, {
                                maxRetriesPerRequest: null,
                                enableReadyCheck: false,
                                ...(redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
                            });
                        },
                    };
                }

                // Fallback local connect
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
            }
        }),
    ],
    exports: [BullModule],
})
export class AppQueueModule { }
