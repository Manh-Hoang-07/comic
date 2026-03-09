import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';
import { USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContextType } from '@/modules/core/rbac/rbac.constants';

describe('RbacService', () => {
    let service: RbacService;
    let assignmentRepo: any;
    let roleHasPermRepo: any;
    let roleContextRepo: any;
    let groupRepo: any;
    let rbacCache: any;
    let prisma: any;

    beforeEach(async () => {
        assignmentRepo = {
            findManyRaw: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            deleteMany: jest.fn()
        };
        roleHasPermRepo = { findMany: jest.fn() };
        roleContextRepo = { findMany: jest.fn() };
        groupRepo = { findById: jest.fn() };
        rbacCache = {
            isCached: jest.fn(),
            hasPermission: jest.fn(),
            setPermissions: jest.fn(),
            redis: { smembers: jest.fn() }
        };
        prisma = {
            $transaction: (cb: any) => cb(prisma),
            userRoleAssignment: { deleteMany: jest.fn(), createMany: jest.fn() },
            permission: { findMany: jest.fn().mockResolvedValue([]) }
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RbacService,
                { provide: USER_GROUP_REPOSITORY, useValue: {} },
                { provide: USER_ROLE_ASSIGNMENT_REPOSITORY, useValue: assignmentRepo },
                { provide: ROLE_HAS_PERMISSION_REPOSITORY, useValue: roleHasPermRepo },
                { provide: ROLE_CONTEXT_REPOSITORY, useValue: roleContextRepo },
                { provide: GROUP_REPOSITORY, useValue: groupRepo },
                { provide: USER_REPOSITORY, useValue: {} },
                { provide: ROLE_REPOSITORY, useValue: {} },
                { provide: RbacCacheService, useValue: rbacCache },
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<RbacService>(RbacService);
    });

    describe('userHasPermissionsInGroup', () => {
        it('should refresh if not cached and return true if has any permission', async () => {
            rbacCache.isCached.mockResolvedValue(false);
            rbacCache.hasPermission.mockResolvedValue(true);

            // Mock refresh login
            assignmentRepo.findManyRaw.mockResolvedValue([{ role_id: 1n }]);
            roleHasPermRepo.findMany.mockResolvedValue([{ permission: { code: 'p1', status: 'active' } }]);

            const result = await service.userHasPermissionsInGroup(1, 10, ['p1']);

            expect(rbacCache.isCached).toHaveBeenCalled();
            expect(rbacCache.setPermissions).toHaveBeenCalledWith(1, 10, ['p1']);
            expect(result).toBe(true);
        });
    });

    describe('refreshUserPermissions', () => {
        it('should flatten permissions correctly', async () => {
            assignmentRepo.findManyRaw.mockResolvedValue([{ role_id: 100n }]);
            roleHasPermRepo.findMany.mockResolvedValue([{ permission: { id: 1n, code: 'child', parent_id: 2n, status: 'active' } }]);
            prisma.permission.findMany.mockResolvedValue([
                { id: 1n, code: 'child', parent_id: 2n, status: 'active' },
                { id: 2n, code: 'parent', parent_id: null, status: 'active' }
            ]);

            await service.refreshUserPermissions(1, 10);

            expect(rbacCache.setPermissions).toHaveBeenCalledWith(1, 10, expect.arrayContaining(['child', 'parent']));
        });
    });

    describe('syncRolesInGroup', () => {
        it('should error if group not found', async () => {
            groupRepo.findById.mockResolvedValue(null);
            await expect(service.syncRolesInGroup(1, 10, [1])).rejects.toThrow(NotFoundException);
        });

        it('should update DB and call refresh', async () => {
            groupRepo.findById.mockResolvedValue({ id: 10, context_id: 1 });
            roleContextRepo.findMany.mockResolvedValue([{ role_id: 1n }]);

            // Mock refresh
            assignmentRepo.findManyRaw.mockResolvedValue([]);

            await service.syncRolesInGroup(1, 10, [1]);

            expect(prisma.userRoleAssignment.deleteMany).toHaveBeenCalled();
            expect(prisma.userRoleAssignment.createMany).toHaveBeenCalled();
            expect(rbacCache.setPermissions).toHaveBeenCalled();
        });
    });
});
