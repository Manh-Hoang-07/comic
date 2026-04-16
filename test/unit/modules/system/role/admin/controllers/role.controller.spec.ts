import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '@/modules/system/role/admin/controllers/role.controller';
import { RoleService } from '@/modules/system/role/admin/services/role.service';
import { Auth } from '@/common/auth/utils';

describe('RoleController', () => {
  let controller: RoleController;
  let service: any;

  beforeEach(async () => {
    service = {
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignPermissions: jest.fn(),
    };

    jest.spyOn(Auth, 'id').mockReturnValue(BigInt(1));
    jest.spyOn(Auth, 'isLogin').mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: RoleService, useValue: service },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call create', async () => {
      const dto = { name: 'Admin' };
      await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should throw error if not authenticated', async () => {
      jest.spyOn(Auth, 'id').mockReturnValue(null);
      await expect(controller.create({})).rejects.toThrow('User not logged in');
    });
  });

  describe('assignPermissions', () => {
    it('should call service.assignPermissions', async () => {
      await controller.assignPermissions(BigInt(1), {
        permission_ids: [BigInt(10), BigInt(20)],
      });
      expect(service.assignPermissions).toHaveBeenCalledWith(BigInt(1), [
        BigInt(10),
        BigInt(20),
      ]);
    });
  });
});
