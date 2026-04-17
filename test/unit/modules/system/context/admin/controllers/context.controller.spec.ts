import { Test, TestingModule } from '@nestjs/testing';
import { AdminContextController } from '@/modules/system/context/admin/controllers/context.controller';
import { AdminContextService } from '@/modules/system/context/admin/services/context.service';

describe('AdminContextController', () => {
  let controller: AdminContextController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminContextController],
      providers: [
        { provide: AdminContextService, useValue: service },
      ],
    }).compile();

    controller = module.get<AdminContextController>(AdminContextController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const body = { type: 'test', name: 'Test' };
      await controller.create(body);
      expect(service.create).toHaveBeenCalledWith(body);
    });
  });

  describe('getList', () => {
    it('should call service.getList', async () => {
      const query = { page: 1 };
      await controller.getList(query);
      expect(service.getList).toHaveBeenCalledWith(query);
    });
  });

  describe('updateContext', () => {
    it('should call service.update', async () => {
      await controller.updateContext(1, { name: 'New' });
      expect(service.update).toHaveBeenCalledWith(1, { name: 'New' });
    });
  });

  describe('deleteContext', () => {
    it('should call service.delete', async () => {
      await controller.deleteContext(1);
      expect(service.delete).toHaveBeenCalledWith(1);
    });
  });
});
