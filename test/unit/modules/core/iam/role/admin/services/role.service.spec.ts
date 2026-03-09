import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '@/modules/core/iam/role/admin/services/role.service';
import { ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as authContextHelper from '@/common/auth/utils/auth-context.helper';

jest.mock('@/common/auth/utils/auth-context.helper');

describe('RoleService', () => {
    let service: RoleService;
    let roleRepo: any;
    let assignmentRepo: any;
    let rbacCache: any;

    beforeEach(async () => {
        roleRepo = {
            findByCode: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            syncContexts: jest.fn(),
            syncPermissions: jest.fn(),
            toPrimaryKey: jest.fn((id) => id),
        };

        assignmentRepo = { count: jest.fn() };
        rbacCache = { bumpVersion: jest.fn().mockResolvedValue(undefined) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                { provide: ROLE_REPOSITORY, useValue: roleRepo },
                { provide: USER_ROLE_ASSIGNMENT_REPOSITORY, useValue: assignmentRepo },
                { provide: RbacCacheService, useValue: rbacCache },
            ],
        }).compile();

        service = module.get<RoleService>(RoleService);
        (authContextHelper.getCurrentUserId as jest.Mock).mockReturnValue(1);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('beforeCreate', () => {
        it('should throw BadRequestException if code exists', async () => {
            roleRepo.findByCode.mockResolvedValue({ id: 1 });
            await expect((service as any).beforeCreate({ code: 'ADMIN' })).rejects.toThrow(BadRequestException);
        });

        it('should set created_user_id and handle parent_id as BigInt', async () => {
            roleRepo.findByCode.mockResolvedValue(null);
            const payload = await (service as any).beforeCreate({ code: 'NEW', parent_id: 10 });
            expect(payload.created_user_id).toBe(1);
            expect(payload.parent_id).toBe(10n);
        });
    });

    describe('create', () => {
        it('should sync contexts if provided', async () => {
            const role = { id: 5n };
            roleRepo.create.mockResolvedValue(role);
            roleRepo.findById.mockResolvedValue(role);

            await service.create({ code: 'NEW', context_ids: [1, 2] });

            expect(roleRepo.syncContexts).toHaveBeenCalledWith(5, [1, 2]);
        });
    });

    describe('beforeDelete', () => {
        it('should throw BadRequestException if role has children', async () => {
            roleRepo.count.mockResolvedValue(1);
            await expect((service as any).beforeDelete(1)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if role is assigned to users', async () => {
            roleRepo.count.mockResolvedValue(0);
            assignmentRepo.count.mockResolvedValue(1);
            await expect((service as any).beforeDelete(1)).rejects.toThrow(BadRequestException);
        });
    });

    describe('assignPermissions', () => {
        it('should sync permissions and bump cache version', async () => {
            const mockRole = { id: BigInt(1) };
            roleRepo.findById.mockResolvedValue(mockRole);

            await service.assignPermissions(1, [10, 20]);

            expect(roleRepo.syncPermissions).toHaveBeenCalledWith(1, [10, 20]);
            expect(rbacCache.bumpVersion).toHaveBeenCalled();
        });
    });

    describe('transform', () => {
        it('should correctly format parent and children and convert BigInt', () => {
            const mockRole = {
                id: BigInt(1),
                parent: { id: BigInt(2), code: 'P1', name: 'Parent', status: 'active', other: 'omit' },
                children: [{ id: BigInt(3), code: 'C1', name: 'Child', status: 'active', other: 'omit' }]
            };
            const result = (service as any).transform(mockRole);
            expect(result.id).toBe(1);
            expect(result.parent).toEqual({ id: 2, code: 'P1', name: 'Parent', status: 'active' });
            expect(result.children[0]).toEqual({ id: 3, code: 'C1', name: 'Child', status: 'active' });
        });
    });
});
