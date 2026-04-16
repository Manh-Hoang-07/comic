import { Test, TestingModule } from '@nestjs/testing';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { RedisUtil } from '@/core/utils/redis.util';
import { ConfigService } from '@nestjs/config';
import { encodeAssignedCodes } from '@/modules/system/rbac/services/rbac-assigned-codes.codec';

describe('RbacCacheService', () => {
  let service: RbacCacheService;
  let redisUtil: any;
  let configService: any;

  beforeEach(async () => {
    redisUtil = {
      isEnabled: jest.fn().mockReturnValue(true),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      publish: jest.fn(),
      trackKey: jest.fn(),
      getTrackedKeys: jest.fn(),
      clearTrackedKeys: jest.fn(),
      subscribe: jest.fn(),
      hgetall: jest.fn().mockResolvedValue({ version: '1' }),
      exists: jest.fn(),
      hincrby: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPermissions', () => {
    it('should return cached codes from Redis', async () => {
      redisUtil.get.mockResolvedValue(encodeAssignedCodes(['p1', 'p2']));

      const result = await service.getPermissions(1, 10);

      expect(result.cached).toBe(true);
      expect(result.codes).toEqual(['p1', 'p2']);
      expect(redisUtil.get).toHaveBeenCalled();
    });

    it('should delete legacy bitmap value and miss', async () => {
      redisUtil.get.mockResolvedValue('b64:v1:abcd');

      const result = await service.getPermissions(1, 10);

      expect(result.cached).toBe(false);
      expect(redisUtil.del).toHaveBeenCalled();
    });
  });

  describe('setPermissions', () => {
    it('should write JSON codes to Redis and publish invalidation', async () => {
      await service.setPermissions(1, 10, ['a', 'b']);

      expect(redisUtil.set).toHaveBeenCalledWith(
        'rbac:v1:u:1:g:10',
        expect.stringContaining('codes:v1:'),
        3600,
      );
      expect(redisUtil.trackKey).toHaveBeenCalledWith(1, 'rbac:v1:u:1:g:10');
      expect(redisUtil.publish).toHaveBeenCalled();
    });
  });

  describe('clearAllUserCaches', () => {
    it('should clear all tracked keys and publish', async () => {
      redisUtil.getTrackedKeys.mockResolvedValue(['key1', 'key2']);
      await service.clearAllUserCaches(1);

      expect(redisUtil.del).toHaveBeenCalledWith('key1');
      expect(redisUtil.del).toHaveBeenCalledWith('key2');
      expect(redisUtil.clearTrackedKeys).toHaveBeenCalledWith(1);
      expect(redisUtil.publish).toHaveBeenCalledWith(
        'rbac:invalidation',
        expect.stringContaining('user_all'),
      );
    });
  });
});
