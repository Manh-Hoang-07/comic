import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRolesService } from '@/modules/core/user/admin/services/user-roles.service';
import { PolicyService } from '@/modules/core/user/admin/services/policy.service';
import { USER_REPOSITORY } from '@/modules/core/user/domain/user.repository';
import { GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { RequestContext } from '@/common/shared/utils';
import { GroupCatalogService } from '@/modules/core/rbac/catalog/group-catalog.service';
import { RoleCatalogService } from '@/modules/core/rbac/catalog/role-catalog.service';
import { RoleContextCatalogService } from '@/modules/core/rbac/catalog/role-context-catalog.service';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';

describe('UserRolesService', () => {
  let service: UserRolesService;
  let userRepo: { findById: jest.Mock; findAssignments: jest.Mock; findMemberGroupIds: jest.Mock };
  let policy: { assertAccess: jest.Mock; roleScope: jest.Mock };
  let groupCatalog: { getAllActiveGroups: jest.Mock; getGroupById: jest.Mock; getGroupsByIds: jest.Mock };
  let roleCatalog: { getAllActiveRoles: jest.Mock };
  let roleContextCatalog: {
    getRoleIdsMapForContextsFromDb: jest.Mock;
    getRoleIdsMapForContextTypeCodesFromDb: jest.Mock;
  };
  let rbacService: { syncRolesInGroup: jest.Mock };
  let groupRepo: { findActiveByIds: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      findAssignments: jest.fn(),
      findMemberGroupIds: jest.fn(),
    };
    policy = {
      assertAccess: jest.fn().mockResolvedValue(undefined),
      roleScope: jest.fn(),
    };
    groupCatalog = {
      getAllActiveGroups: jest.fn().mockResolvedValue([]),
      getGroupById: jest.fn().mockResolvedValue(null),
      getGroupsByIds: jest.fn().mockResolvedValue([]),
    };
    roleCatalog = {
      getAllActiveRoles: jest.fn().mockResolvedValue([]),
    };
    roleContextCatalog = {
      getRoleIdsMapForContextsFromDb: jest.fn().mockResolvedValue(new Map()),
      getRoleIdsMapForContextTypeCodesFromDb: jest.fn().mockResolvedValue(new Map()),
    };
    rbacService = { syncRolesInGroup: jest.fn().mockResolvedValue(undefined) };
    groupRepo = { findActiveByIds: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: GROUP_REPOSITORY, useValue: groupRepo },
        { provide: PolicyService, useValue: policy },
        { provide: GroupCatalogService, useValue: groupCatalog },
        { provide: RoleCatalogService, useValue: roleCatalog },
        { provide: RoleContextCatalogService, useValue: roleContextCatalog },
        { provide: RbacService, useValue: rbacService },
      ],
    }).compile();

    service = module.get(UserRolesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserRoles', () => {
    it('returns [] in system context when user has no member groups', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });
      userRepo.findMemberGroupIds.mockResolvedValue([]);

      const result = await service.getUserRoles(1);

      expect(result).toEqual([]);
      expect(userRepo.findAssignments).not.toHaveBeenCalled();
    });

    it('throws when non-system context without groupId', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        return undefined;
      });

      await expect(service.getUserRoles(1)).rejects.toThrow(ForbiddenException);
    });

    it('loads assignments scoped to current group in non-system context', async () => {
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 1;
        return undefined;
      });
      userRepo.findAssignments.mockResolvedValue([
        {
          group_id: 1n,
          role_id: 10n,
          role: { code: 'r1', name: 'Role 1' },
          group: { code: 'g1', name: 'G1' },
        },
        {
          group_id: 1n,
          role_id: 10n,
          role: { code: 'r1', name: 'Role 1' },
          group: { code: 'g1', name: 'G1' },
        },
        {
          group_id: 1n,
          role_id: 11n,
          role: { code: 'r2', name: 'Role 2' },
          group: { code: 'g1', name: 'G1' },
        },
      ]);

      const result = await service.getUserRoles(5);

      expect(policy.assertAccess).toHaveBeenCalledWith(5);
      expect(userRepo.findAssignments).toHaveBeenCalledWith(5, [1n]);
      expect(result).toHaveLength(1);
      expect(result[0].roles).toHaveLength(2);
      expect(result[0].roles.map((r: any) => r.role_code)).toEqual(['r1', 'r2']);
    });
  });

  describe('getUserRolesTree', () => {
    it('throws NotFound when user missing', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.getUserRolesTree(99)).rejects.toThrow(NotFoundException);
      expect(policy.assertAccess).not.toHaveBeenCalled();
    });

    it('returns [] in system context when target user has no member groups', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });
      userRepo.findMemberGroupIds.mockResolvedValue([]);

      const result = await service.getUserRolesTree(1);

      expect(result).toEqual([]);
      expect(userRepo.findMemberGroupIds).toHaveBeenCalledWith(1);
      expect(groupCatalog.getGroupsByIds).toHaveBeenCalledWith([]);
    });

    it('builds tree for current group in non-system context', async () => {
      userRepo.findById.mockResolvedValue({ id: 5 });
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 10;
        return undefined;
      });
      groupCatalog.getGroupsByIds.mockResolvedValue([
        {
          id: '10',
          name: 'G1',
          contextId: '1',
          code: 'g1',
          type: 'x',
          status: 'active',
        },
      ]);
      groupRepo.findActiveByIds.mockResolvedValue([
        { id: 10n, context_id: 1n, context: { type: 'x', code: 'y' } },
      ]);
      roleContextCatalog.getRoleIdsMapForContextsFromDb.mockResolvedValue(
        new Map([['1', ['100', '101']]]),
      );
      roleCatalog.getAllActiveRoles.mockResolvedValue([
        { id: '100', code: 'a', name: 'R100', status: 'active', parentId: null },
        { id: '101', code: 'b', name: 'R101', status: 'active', parentId: null },
      ]);
      userRepo.findAssignments.mockResolvedValue([
        { group_id: 10n, role_id: 100n, role: {}, group: {} },
      ]);

      const result = await service.getUserRolesTree(5);

      expect(groupCatalog.getGroupsByIds).toHaveBeenCalledWith([10]);
      expect(result).toHaveLength(1);
      expect(result[0].group_id).toBe(10);
      expect(result[0].checked).toBe(false);
      expect(result[0].indeterminate).toBe(true);
      expect(result[0].roles.find((r: any) => r.role_id === 100)?.checked).toBe(true);
      expect(result[0].roles.find((r: any) => r.role_id === 101)?.checked).toBe(false);
    });
  });

  describe('batchSyncUserRoles', () => {
    it('throws NotFound when user missing', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.batchSyncUserRoles(1, [])).rejects.toThrow(NotFoundException);
    });

    it('rejects non-array body', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });

      await expect(service.batchSyncUserRoles(1, null as any)).rejects.toThrow('JSON array');
    });

    it('calls syncRolesInGroup per group (dedup last wins)', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });

      await service.batchSyncUserRoles(1, [
        { group_id: 2, role_ids: [1] },
        { group_id: 2, role_ids: [2, 3] },
      ]);

      expect(rbacService.syncRolesInGroup).toHaveBeenCalledTimes(1);
      expect(rbacService.syncRolesInGroup).toHaveBeenCalledWith(1, 2, [2, 3], true);
    });

    it('forbids group_id outside context for non-system', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'tenant' };
        if (key === 'groupId') return 99;
        return undefined;
      });

      await expect(
        service.batchSyncUserRoles(1, [{ group_id: 1, role_ids: [] }]),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
