import { Test, TestingModule } from '@nestjs/testing';
import { PermissionController } from '@/modules/system/permission/admin/controllers/permission.controller';
import { PermissionService } from '@/modules/system/permission/admin/services/permission.service';

jest.mock('@/common/auth/utils', () => ({
  Auth: {
    id: jest.fn(),
  },
}));

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: any;

  beforeEach(async () => {
    service = {
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [{ provide: PermissionService, useValue: service }],
    }).compile();

    controller = module.get<PermissionController>(PermissionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getList', () => {
    it('should query list of permissions', async () => {
      const q = { page: 1 };
      service.getList.mockResolvedValue({ data: [] });
      const result = await controller.getList(q);
      expect(service.getList).toHaveBeenCalledWith(q);
      expect(result.data).toEqual([]);
    });
  });

  describe('getSimpleList', () => {
    it('should query simple list of permissions', async () => {
      const q = { search: 'test' };
      service.getSimpleList.mockResolvedValue({ data: [] });
      const result = await controller.getSimpleList(q);
      expect(service.getSimpleList).toHaveBeenCalledWith(q);
      expect(result.data).toEqual([]);
    });
  });

  describe('getOne', () => {
    it('should get a single permission', async () => {
      service.getOne.mockResolvedValue({ id: 1 });
      const result = await controller.getOne(1);
      expect(service.getOne).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });
  });

  describe('create', () => {
    it('should create permission with audit info', async () => {
      const dto = { name: 'P' };
      service.create.mockResolvedValue({ id: 1 });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('should update permission with audit info', async () => {
      const dto = { name: 'P' };
      service.update.mockResolvedValue({ id: 1 });

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result.id).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete permission', async () => {
      service.delete.mockResolvedValue(true);
      const result = await controller.delete(1);
      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });
});
