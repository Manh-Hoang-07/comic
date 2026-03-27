import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const redisUrl = configService.get<string>('REDIS_URL');
                let redisConfig: any = {};

                if (redisUrl) {
                    try {
                        const url = new URL(redisUrl);
                        redisConfig = {
                            host: url.hostname,
                            port: Number(url.port),
                            username: url.username ? decodeURIComponent(url.username) : undefined,
                            password: url.password ? decodeURIComponent(url.password) : undefined,
                            tls: url.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
                            family: 4, // Force IPv4 (Quan trọng khi dùng Upstash trên Node >= 18)
                            enableReadyCheck: false, // Tránh lỗi INFO command của Upstash serverless
                            maxRetriesPerRequest: null, // Yêu cầu từ Bull
                        };
                    } catch (e) {
                        // Fallback if URL parsing fails or if users prefer host/port envs
                        redisConfig = {
                            host: configService.get<string>('REDIS_HOST') || 'localhost',
                            port: configService.get<number>('REDIS_PORT') || 6379,
                        };
                    }
                } else {
                    redisConfig = {
                        host: configService.get<string>('REDIS_HOST') || 'localhost',
                        port: configService.get<number>('REDIS_PORT') || 6379,
                    };
                }

                return {
                    redis: redisConfig,
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
