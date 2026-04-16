import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { RbacPermissionIndexService } from '@/modules/system/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/system/rbac/services/rbac-role-assignment.service';
import { ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/system/rbac/role-has-permission/domain/role-has-permission.repository';
import { NotFoundException } from '@nestjs/common';

describe('RbacService', () => {
  let service: RbacService;
  let rbacCache: jest.Mocked<
    Pick<RbacCacheService, 'getPermissions' | 'setPermissions'>
  >;
  let permissionIndex: jest.Mocked<
    Pick<
      RbacPermissionIndexService,
      'prepare' | 'hasAnyRequiredFromAssigned' | 'matchesAssigned'
    >
  >;
  let roleAssignment: jest.Mocked<
    Pick<RbacRoleAssignmentService, 'getActiveRoleIds' | 'syncRolesInGroup'>
  >;
  let roleHasPermRepo: { findActivePermissionCodesByRoleIds: jest.Mock };

  beforeEach(async () => {
    rbacCache = {
      getPermissions: jest.fn(),
      setPermissions: jest.fn(),
    };
    permissionIndex = {
      prepare: jest.fn().mockResolvedValue(undefined),
      hasAnyRequiredFromAssigned: jest.fn(),
      matchesAssigned: jest.fn(),
    };
    roleAssignment = {
      getActiveRoleIds: jest.fn(),
      syncRolesInGroup: jest.fn().mockResolvedValue(undefined),
    };
    roleHasPermRepo = {
      findActivePermissionCodesByRoleIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: RbacCacheService, useValue: rbacCache },
        { provide: RbacPermissionIndexService, useValue: permissionIndex },
        { provide: RbacRoleAssignmentService, useValue: roleAssignment },
        { provide: ROLE_HAS_PERMISSION_REPOSITORY, useValue: roleHasPermRepo },
      ],
    }).compile();

    service = module.get(RbacService);
  });

  describe('hasPermissions', () => {
    it('returns true when index grants any required permission', async () => {
      rbacCache.getPermissions.mockResolvedValue({
        codes: ['p1'],
        cached: true,
      });
      permissionIndex.hasAnyRequiredFromAssigned.mockReturnValue(true);

      const result = await service.hasPermissions(1, 10, ['p1']);

      expect(permissionIndex.prepare).toHaveBeenCalled();
      expect(permissionIndex.hasAnyRequiredFromAssigned).toHaveBeenCalledWith(
        expect.any(Set),
        ['p1'],
      );
      expect(result).toBe(true);
    });
  });

  describe('refreshPermissions', () => {
    it('loads role ids, codes, caches and returns set', async () => {
      rbacCache.getPermissions.mockResolvedValueOnce({
        codes: [],
        cached: false,
      });
      roleAssignment.getActiveRoleIds.mockResolvedValue([100n]);
      roleHasPermRepo.findActivePermissionCodesByRoleIds.mockResolvedValue([
        'a',
        'b',
      ]);

      const set = await service.refreshPermissions(1, 10);

      expect(roleAssignment.getActiveRoleIds).toHaveBeenCalledWith(1, 10);
      expect(
        roleHasPermRepo.findActivePermissionCodesByRoleIds,
      ).toHaveBeenCalledWith([100n]);
      expect(rbacCache.setPermissions).toHaveBeenCalledWith(
        1,
        10,
        expect.arrayContaining(['a', 'b']),
      );
      expect(set.has('a')).toBe(true);
      expect(set.has('b')).toBe(true);
    });
  });

  describe('syncRolesInGroup', () => {
    it('delegates to role assignment and refreshes', async () => {
      rbacCache.getPermissions.mockResolvedValue({ codes: [], cached: true });
      roleAssignment.getActiveRoleIds.mockResolvedValue([]);
      roleHasPermRepo.findActivePermissionCodesByRoleIds.mockResolvedValue([]);

      await service.syncRolesInGroup(1, 10, [1], true);

      expect(roleAssignment.syncRolesInGroup).toHaveBeenCalledWith(
        1,
        10,
        [1],
        true,
      );
      expect(rbacCache.setPermissions).toHaveBeenCalled();
    });

    it('propagates not found from role assignment', async () => {
      roleAssignment.syncRolesInGroup.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(service.syncRolesInGroup(1, 10, [1])).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
