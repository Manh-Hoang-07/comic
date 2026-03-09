import { Test, TestingModule } from '@nestjs/testing';
import { AdminGroupService } from '@/modules/core/context/group/admin/services/group.service';
import { GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { CONTEXT_REPOSITORY } from '@/modules/core/context/context/domain/context.repository';
import { GroupActionService } from '@/modules/core/context/group/admin/services/group-action.service';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AdminGroupService', () => {
    let service: AdminGroupService;
    let groupRepo: any;
    let contextRepo: any;
    let groupActionService: any;
    let rbacService: any;

    beforeEach(async () => {
        groupRepo = {
            findById: jest.fn(),
            findByCode: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            toPrimaryKey: jest.fn((id) => id),
        };

        contextRepo = {
            findById: jest.fn(),
        };

        groupActionService = {
            syncGroupOwner: jest.fn().mockResolvedValue(undefined),
        };

        rbacService = {
            isSystemAdmin: jest.fn(),
            userHasPermissionsInGroup: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminGroupService,
                { provide: GROUP_REPOSITORY, useValue: groupRepo },
                { provide: CONTEXT_REPOSITORY, useValue: contextRepo },
                { provide: GroupActionService, useValue: groupActionService },
                { provide: RbacService, useValue: rbacService },
            ],
        }).compile();

        service = module.get<AdminGroupService>(AdminGroupService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('beforeCreate', () => {
        it('should throw NotFoundException if context not found or inactive', async () => {
            contextRepo.findById.mockResolvedValue(null);
            await expect((service as any).beforeCreate({ context_id: 1 })).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if group code already exists', async () => {
            contextRepo.findById.mockResolvedValue({ id: 1, status: 'active' });
            groupRepo.findByCode.mockResolvedValue({ id: 2 });
            await expect((service as any).beforeCreate({ context_id: 1, code: 'G1' })).rejects.toThrow(BadRequestException);
        });

        it('should return valid payload with BigInt conversion', async () => {
            contextRepo.findById.mockResolvedValue({ id: 1, status: 'active' });
            groupRepo.findByCode.mockResolvedValue(null);

            const result = await (service as any).beforeCreate({ context_id: 1, code: 'G1', owner_id: 10 });
            expect(result.context_id).toBe(1n);
            expect(result.owner_id).toBe(10n);
        });
    });

    describe('afterCreate', () => {
        it('should call groupActionService.syncGroupOwner', async () => {
            const group = { id: 2n, owner_id: 10n };
            await (service as any).afterCreate(group);
            expect(groupActionService.syncGroupOwner).toHaveBeenCalledWith(2n, 10n);
        });
    });
});
