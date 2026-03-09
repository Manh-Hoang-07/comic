import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from '@/modules/core/menu/admin/services/menu.service';
import { MENU_REPOSITORY } from '@/modules/core/menu/domain/menu.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { BadRequestException } from '@nestjs/common';
import * as menuHelper from '@/modules/core/menu/utils/menu.helper';

jest.mock('@/modules/core/menu/utils/menu.helper');

describe('MenuService', () => {
    let service: MenuService;
    let menuRepo: any;
    let rbacService: any;

    beforeEach(async () => {
        menuRepo = {
            findByCode: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findAllWithChildren: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            toPrimaryKey: jest.fn((id) => id),
        };

        rbacService = {
            userHasPermissionsInGroup: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenuService,
                {
                    provide: MENU_REPOSITORY,
                    useValue: menuRepo,
                },
                {
                    provide: RbacService,
                    useValue: rbacService,
                },
            ],
        }).compile();

        service = module.get<MenuService>(MenuService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('beforeCreate', () => {
        it('should throw BadRequestException if code already exists', async () => {
            menuRepo.findByCode.mockResolvedValue({ id: 1 });
            await expect((service as any).beforeCreate({ code: 'CODE' })).rejects.toThrow(BadRequestException);
        });

        it('should convert IDs to BigInt', async () => {
            menuRepo.findByCode.mockResolvedValue(null);
            const result = await (service as any).beforeCreate({ parent_id: 10, required_permission_id: 20 });
            expect(result.parent_id).toBe(10n);
            expect(result.required_permission_id).toBe(20n);
        });
    });

    describe('getUserMenus', () => {
        it('should call helper functions to filter and build tree', async () => {
            const mockMenus = [{ id: 1, code: 'm1', show_in_menu: true }];
            menuRepo.findAllWithChildren.mockResolvedValue(mockMenus);

            rbacService.getUserPermissions = jest.fn().mockResolvedValue(new Set());
            (menuHelper.filterAdminMenus as jest.Mock).mockReturnValue(mockMenus);
            (menuHelper.buildMenuTree as jest.Mock).mockReturnValue([{ id: 1, children: [] }]);

            const result = await service.getUserMenus(1, { group: 'admin' });

            expect(menuRepo.findAllWithChildren).toHaveBeenCalled();
            expect(menuHelper.filterAdminMenus).toHaveBeenCalled();
            expect(menuHelper.buildMenuTree).toHaveBeenCalledWith(mockMenus);
            expect(result).toEqual([{ id: 1, children: [] }]);
        });
    });
});
