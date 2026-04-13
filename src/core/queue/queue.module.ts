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

                // Vercel Fallback: Default to known Upstash URL if not explicitly provided in environment
                if (process.env.VERCEL) {
                    return {
                        createClient: () => {
                            const Redis = require('ioredis');
                            const fallbackUrl = 'rediss://default:gQAAAAAAAVCsAAIncDExNzAzNDU4MTc3Mjg0ZmYxOTc1YWViNDk5MzljOTU2NHAxODYxODg@crack-monitor-86188.upstash.io:6379';
                            return new Redis(fallbackUrl, {
                                maxRetriesPerRequest: null,
                                enableReadyCheck: false,
                                tls: { rejectUnauthorized: false },
                            });
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
            }
        }),
    ],
    exports: [BullModule],
})
export class AppQueueModule { }
