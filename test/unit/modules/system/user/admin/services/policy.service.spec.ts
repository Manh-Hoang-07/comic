import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PolicyService } from '@/modules/system/user/admin/services/policy.service';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';
import { RequestContext } from '@/common/shared/utils';

describe('PolicyService', () => {
  let policy: PolicyService;
  let userRepo: { exists: jest.Mock; checkMultipleUniques: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      exists: jest.fn(),
      checkMultipleUniques: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    policy = module.get(PolicyService);
    jest.spyOn(RequestContext, 'get').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('assertAccess', () => {
    it('allows when context is system', async () => {
      jest
        .spyOn(RequestContext, 'get')
        .mockImplementation((key: string) =>
          key === 'context' ? { type: 'system' } : undefined,
        );

      await expect(policy.assertAccess(1)).resolves.toBeUndefined();
      expect(userRepo.exists).not.toHaveBeenCalled();
    });

    it('throws when not system and missing context or groupId', async () => {
      jest.spyOn(RequestContext, 'get').mockReturnValue(undefined);

      await expect(policy.assertAccess(1)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(userRepo.exists).not.toHaveBeenCalled();
    });

    it('throws when user is not in current group', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 10;
        return undefined;
      });
      userRepo.exists.mockResolvedValue(false);

      await expect(policy.assertAccess(5)).rejects.toThrow(
        /không có quyền truy cập/,
      );
      expect(userRepo.exists).toHaveBeenCalled();
    });

    it('resolves when user belongs to current group', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 10;
        return undefined;
      });
      userRepo.exists.mockResolvedValue(true);

      await expect(policy.assertAccess(5)).resolves.toBeUndefined();
    });
  });

  describe('roleScope', () => {
    it('returns all when system and no groupIds filter', () => {
      jest
        .spyOn(RequestContext, 'get')
        .mockImplementation((key: string) =>
          key === 'context' ? { type: 'system' } : undefined,
        );

      expect(policy.roleScope()).toEqual({ kind: 'all' });
    });

    it('returns scoped list when system and groupIds provided', () => {
      jest
        .spyOn(RequestContext, 'get')
        .mockImplementation((key: string) =>
          key === 'context' ? { type: 'system' } : undefined,
        );

      expect(policy.roleScope('1,2')).toEqual({
        kind: 'scoped',
        groupIds: ['1', '2'],
      });
    });

    it('returns none when group admin requests only other groups', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 10;
        return undefined;
      });

      expect(policy.roleScope('99')).toEqual({ kind: 'none' });
    });

    it('returns current group when group admin and no filter', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 10;
        return undefined;
      });

      expect(policy.roleScope()).toEqual({ kind: 'scoped', groupIds: [10] });
    });
  });

  describe('assertUnique', () => {
    it('delegates to repository', async () => {
      await policy.assertUnique({ email: 'a@b.com' }, 1);
      expect(userRepo.checkMultipleUniques).toHaveBeenCalledWith(
        { email: 'a@b.com', phone: undefined, username: undefined },
        1,
      );
    });
  });
});
