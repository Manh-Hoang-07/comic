import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '@/modules/system/user/admin/controllers/user.controller';
import { UserService } from '@/modules/system/user/admin/services/user.service';
import { UserRolesService } from '@/modules/system/user/admin/services/user-roles.service';

describe('UserController', () => {
  let controller: UserController;
  let service: any;
  let userRoles: any;

  beforeEach(async () => {
    service = {
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      changePassword: jest.fn(),
      delete: jest.fn(),
    };
    userRoles = {
      getUserRoles: jest.fn(),
      getUserRolesTree: jest.fn(),
      batchSyncUserRoles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: service },
        { provide: UserRolesService, useValue: userRoles },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getList', () => {
    it('should call service.getList', async () => {
      await controller.getList({ page: 1 });
      expect(service.getList).toHaveBeenCalledWith({ page: 1 });
    });
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { email: 'test@test.com' };
      await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('changePassword', () => {
    it('should call service.changePassword', async () => {
      const dto = { password: 'new' };
      await controller.changePassword(1, dto as any);
      expect(service.changePassword).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('getRoles', () => {
    it('should call userRoles.getUserRoles with groupIds query', async () => {
      await controller.getRoles(2, '1,2');
      expect(userRoles.getUserRoles).toHaveBeenCalledWith(2, '1,2');
    });
  });

  describe('getSimpleList', () => {
    it('should call service.getSimpleList', async () => {
      await controller.getSimpleList({ limit: 50 } as any);
      expect(service.getSimpleList).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  describe('delete', () => {
    it('should call service.delete', async () => {
      await controller.delete(9);
      expect(service.delete).toHaveBeenCalledWith(9);
    });
  });

  describe('updateStatus', () => {
    it('should call service.update with status', async () => {
      await controller.updateStatus(3, { status: 'inactive' });
      expect(service.update).toHaveBeenCalledWith(3, { status: 'inactive' });
    });
  });
});
