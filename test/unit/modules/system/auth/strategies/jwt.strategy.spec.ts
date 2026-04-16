import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '@/modules/system/auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { RedisUtil } from '@/core/utils/redis.util';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: any;
  let redis: any;
  let config: any;

  beforeEach(async () => {
    userRepo = { findById: jest.fn() };
    redis = { get: jest.fn(), set: jest.fn() };
    config = { get: jest.fn().mockReturnValue('secret') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: config },
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: RedisUtil, useValue: redis },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should return cached user if available', async () => {
    const cachedUser = JSON.stringify({
      id: '1',
      username: 'test',
      profile: null,
    });
    redis.get.mockResolvedValue(cachedUser);

    const result = await strategy.validate({ sub: 1 });

    expect(result).not.toBeNull();
    expect((result as { id: string }).id).toBe('1');
    expect(userRepo.findById).not.toHaveBeenCalled();
  });

  it('should load from DB if cache miss', async () => {
    redis.get.mockResolvedValue(null);
    userRepo.findById.mockResolvedValue({
      id: BigInt(1),
      username: 'db_user',
      profile: null,
    });

    const result = await strategy.validate({ sub: 1 });

    expect(result).not.toBeNull();
    expect((result as { username: string }).username).toBe('db_user');
    expect(redis.set).toHaveBeenCalled();
  });

  it('should return null if user not found', async () => {
    redis.get.mockResolvedValue(null);
    userRepo.findById.mockResolvedValue(null);

    const result = await strategy.validate({ sub: 1 });
    expect(result).toBeNull();
  });
});
