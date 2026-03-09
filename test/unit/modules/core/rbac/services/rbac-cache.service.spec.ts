import { Test, TestingModule } from '@nestjs/testing';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { RedisUtil } from '@/core/utils/redis.util';
import { ConfigService } from '@nestjs/config';

describe('RbacCacheService', () => {
    let service: RbacCacheService;
    let redisUtil: any;
    let configService: any;

    beforeEach(async () => {
        redisUtil = {
            isEnabled: jest.fn().mockReturnValue(true),
            sismember: jest.fn(),
            smembers: jest.fn(),
            del: jest.fn(),
            sadd: jest.fn(),
            publish: jest.fn(),
            trackKey: jest.fn(),
            getTrackedKeys: jest.fn(),
            clearTrackedKeys: jest.fn(),
            subscribe: jest.fn(),
        };

        configService = {
            get: jest.fn().mockReturnValue(3600),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RbacCacheService,
                { provide: RedisUtil, useValue: redisUtil },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<RbacCacheService>(RbacCacheService);
        // @ts-ignore: reset L1 cache for each test
        service.l1Cache = new Map();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('hasPermission', () => {
        it('should check L1 cache first', async () => {
            const key = 'rbac:u:1:g:10';
            // @ts-ignore: populate L1
            service.l1Cache.set(key, { data: new Set(['perm1']), expiry: Date.now() + 10000 });

            const result = await service.hasPermission(1, 10, 'perm1');
            expect(result).toBe(true);
            expect(redisUtil.sismember).not.toHaveBeenCalled();
        });

        it('should fallback to L2 (Redis) and load to L1', async () => {
            redisUtil.sismember.mockResolvedValue(1);
            redisUtil.smembers.mockResolvedValue(['perm1', 'perm2']);

            const result = await service.hasPermission(1, 10, 'perm1');
            expect(result).toBe(true);
            expect(redisUtil.sismember).toHaveBeenCalled();
            expect(redisUtil.smembers).toHaveBeenCalled();

            // Check if loaded to L1
            // @ts-ignore
            expect(service.l1Cache.has('rbac:u:1:g:10')).toBe(true);
        });
    });

    describe('setPermissions', () => {
        it('should update Redis and publish invalidation', async () => {
            redisUtil.client = { expire: jest.fn() };
            await service.setPermissions(1, 10, ['p1', 'p2']);

            expect(redisUtil.del).toHaveBeenCalledWith('rbac:u:1:g:10');
            expect(redisUtil.sadd).toHaveBeenCalledWith('rbac:u:1:g:10', 'p1', 'p2');
            expect(redisUtil.trackKey).toHaveBeenCalledWith(1, 'rbac:u:1:g:10');
            expect(redisUtil.publish).toHaveBeenCalled();
            // @ts-ignore: check L1 cleared
            expect(service.l1Cache.has('rbac:u:1:g:10')).toBe(false);
        });
    });

    describe('clearAllUserCaches', () => {
        it('should clear all tracked keys and publish', async () => {
            redisUtil.getTrackedKeys.mockResolvedValue(['key1', 'key2']);
            await service.clearAllUserCaches(1);

            expect(redisUtil.del).toHaveBeenCalledWith('key1');
            expect(redisUtil.del).toHaveBeenCalledWith('key2');
            expect(redisUtil.clearTrackedKeys).toHaveBeenCalledWith(1);
            expect(redisUtil.publish).toHaveBeenCalledWith('rbac:invalidation', expect.stringContaining('user_all'));
        });
    });
});
