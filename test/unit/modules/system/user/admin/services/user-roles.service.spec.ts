import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRolesService } from '@/modules/system/user/admin/services/user-roles.service';
import { UserRoleScopeService } from '@/modules/system/user/admin/services/user-role-scope.service';
import { PolicyService } from '@/modules/system/user/admin/services/policy.service';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';
import { ROLE_REPOSITORY } from '@/modules/system/role/domain/role.repository';
import { ROLE_CONTEXT_REPOSITORY } from '@/modules/system/rbac/role-context/domain/role-context.repository';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';

describe('UserRolesService', () => {
  let service: UserRolesService;
  let userRepo: {
    findById: jest.Mock;
    findAssignments: jest.Mock;
    findMemberGroupIds: jest.Mock;
  };
  let policy: { assertAccess: jest.Mock; roleScope: jest.Mock };
  let roleRepo: { findMany: jest.Mock };
  let roleContextRepo: { findMany: jest.Mock };
  let rbacService: { syncRolesInGroup: jest.Mock };
  let roleScope: {
    resolveRoleUi: jest.Mock;
    guardBatchGroups: jest.Mock;
  };

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
    roleRepo = { findMany: jest.fn().mockResolvedValue([]) };
    roleContextRepo = { findMany: jest.fn().mockResolvedValue([]) };
    rbacService = { syncRolesInGroup: jest.fn().mockResolvedValue(undefined) };
    roleScope = {
      resolveRoleUi: jest.fn(),
      guardBatchGroups: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: ROLE_REPOSITORY, useValue: roleRepo },
        { provide: ROLE_CONTEXT_REPOSITORY, useValue: roleContextRepo },
        { provide: PolicyService, useValue: policy },
        { provide: RbacService, useValue: rbacService },
        { provide: UserRoleScopeService, useValue: roleScope },
      ],
    }).compile();

    service = module.get(UserRolesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserRoles', () => {
    it('returns [] when scope has no assignment groups', async () => {
      roleScope.resolveRoleUi.mockResolvedValue({
        groups: [],
        assignmentGroupPks: [],
        groupRows: [],
      });

      const result = await service.getUserRoles(1);

      expect(result).toEqual([]);
      expect(userRepo.findAssignments).not.toHaveBeenCalled();
    });

    it('propagates Forbidden from scope resolution', async () => {
      roleScope.resolveRoleUi.mockRejectedValue(
        new ForbiddenException('No context'),
      );

      await expect(service.getUserRoles(1)).rejects.toThrow(ForbiddenException);
    });

    it('loads assignments for scoped groups and dedupes roles', async () => {
      roleScope.resolveRoleUi.mockResolvedValue({
        groups: [
          {
            id: '1',
            code: 'g',
            type: 't',
            name: 'G',
            status: 'active',
            contextId: '1',
          },
        ],
        assignmentGroupPks: [1n],
        groupRows: [],
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
      expect(result[0].roles.map((r: any) => r.role_code)).toEqual([
        'r1',
        'r2',
      ]);
    });
  });

  describe('getUserRolesTree', () => {
    it('throws NotFound when user missing', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.getUserRolesTree(99)).rejects.toThrow(
        NotFoundException,
      );
      expect(policy.assertAccess).not.toHaveBeenCalled();
    });

    it('returns [] when scope yields no groups', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });
      roleScope.resolveRoleUi.mockResolvedValue({
        groups: [],
        assignmentGroupPks: [],
        groupRows: [],
      });

      const result = await service.getUserRolesTree(1);

      expect(result).toEqual([]);
    });

    it('builds tree for scoped groups', async () => {
      userRepo.findById.mockResolvedValue({ id: 5 });
      roleScope.resolveRoleUi.mockResolvedValue({
        groups: [
          {
            id: '10',
            code: 'g1',
            type: 'x',
            name: 'G1',
            status: 'active',
            contextId: '1',
          },
        ],
        assignmentGroupPks: [10n],
        groupRows: [
          {
            id: 10n,
            code: 'g1',
            type: 'x',
            name: 'G1',
            status: 'active',
            context_id: 1n,
            context: { type: 'x', code: 'y' },
          },
        ],
      });
      roleContextRepo.findMany.mockImplementation(async (opts: any) => {
        if (opts?.where?.context_id?.in) {
          return [
            { context_id: 1n, role_id: 100n },
            { context_id: 1n, role_id: 101n },
          ];
        }
        return [];
      });
      roleRepo.findMany.mockResolvedValue([
        {
          id: 100n,
          code: 'a',
          name: 'R100',
          status: 'active',
          parent_id: null,
        },
        {
          id: 101n,
          code: 'b',
          name: 'R101',
          status: 'active',
          parent_id: null,
        },
      ]);
      userRepo.findAssignments.mockResolvedValue([
        { group_id: 10n, role_id: 100n, role: {}, group: {} },
      ]);

      const result = await service.getUserRolesTree(5);

      expect(result).toHaveLength(1);
      expect(result[0].group_id).toBe(10);
      expect(result[0].checked).toBe(false);
      expect(result[0].indeterminate).toBe(true);
      expect(result[0].roles.find((r: any) => r.role_id === 100)?.checked).toBe(
        true,
      );
      expect(result[0].roles.find((r: any) => r.role_id === 101)?.checked).toBe(
        false,
      );
    });
  });

  describe('batchSyncUserRoles', () => {
    it('throws NotFound when user missing', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.batchSyncUserRoles(1, [])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects non-array body', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });

      await expect(service.batchSyncUserRoles(1, null as any)).rejects.toThrow(
        'JSON array',
      );
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
      expect(rbacService.syncRolesInGroup).toHaveBeenCalledWith(
        1,
        2,
        [2, 3],
        true,
      );
    });

    it('delegates batch group guard to UserRoleScopeService', async () => {
      userRepo.findById.mockResolvedValue({ id: 1 });
      roleScope.guardBatchGroups.mockImplementation(() => {
        throw new ForbiddenException(
          'group_id is not allowed in the current context',
        );
      });

      await expect(
        service.batchSyncUserRoles(1, [{ group_id: 1, role_ids: [] }]),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
