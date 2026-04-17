import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleScopeService } from '@/modules/system/user/admin/services/user-role-scope.service';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';
import { GROUP_REPOSITORY } from '@/modules/system/group/domain/group.repository';
import { RequestContext } from '@/common/shared/utils';
import * as groupOwnership from '@/common/shared/utils/group-ownership.util';

describe('UserRoleScopeService', () => {
  let service: UserRoleScopeService;
  let userRepo: { findMemberGroupIds: jest.Mock };
  let groupRepo: { findActiveByIds: jest.Mock };

  beforeEach(async () => {
    userRepo = { findMemberGroupIds: jest.fn() };
    groupRepo = { findActiveByIds: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleScopeService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: GROUP_REPOSITORY, useValue: groupRepo },
      ],
    }).compile();

    service = module.get(UserRoleScopeService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('resolveRoleUi', () => {
    it('returns [] groups when system context and user has no member groups', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });
      userRepo.findMemberGroupIds.mockResolvedValue([]);

      const result = await service.resolveRoleUi(1);

      expect(result.assignmentGroupPks).toEqual([]);
      expect(result.groups).toEqual([]);
      expect(result.groupRows).toEqual([]);
      expect(groupRepo.findActiveByIds).toHaveBeenCalledWith([]);
    });

    it('throws when non-system context without groupId', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        return undefined;
      });

      await expect(service.resolveRoleUi(1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('scopes to current groupId in non-system context', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 10;
        return undefined;
      });
      const rows = [
        {
          id: 10n,
          code: 'g1',
          type: 'x',
          name: 'G1',
          status: 'active',
          context_id: 1n,
        },
      ];
      groupRepo.findActiveByIds.mockResolvedValue(rows);

      const result = await service.resolveRoleUi(5);

      expect(groupRepo.findActiveByIds).toHaveBeenCalledWith([10n]);
      expect(result.assignmentGroupPks).toEqual([10n]);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].id).toBe('10');
      expect(result.groupRows).toBe(rows);
    });
  });

  describe('guardBatchGroups', () => {
    it('allows any group_id in system context', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });

      expect(() =>
        service.guardBatchGroups([{ group_id: 1 }, { group_id: 2 }]),
      ).not.toThrow();
    });

    it('forbids group_id outside current tenant group', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 99;
        return undefined;
      });

      expect(() => service.guardBatchGroups([{ group_id: 1 }])).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('mergeListFilter', () => {
    it('merges group filter for system context', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });
      jest
        .spyOn(groupOwnership, 'getGroupFilter')
        .mockReturnValue({ group_id: 9 });

      const out = service.mergeListFilter({ search: 'a' });

      expect(out).toEqual(
        expect.objectContaining({ search: 'a', group_id: 9 }),
      );
    });

    it('adds groupId from context for non-system', () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 200;
        return undefined;
      });

      const out = service.mergeListFilter({ status: 'active' });

      expect(out).toEqual({ status: 'active', groupId: 200 });
    });
  });
});
