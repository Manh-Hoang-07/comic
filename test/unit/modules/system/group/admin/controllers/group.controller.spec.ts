import { Test, TestingModule } from '@nestjs/testing';
import { AdminGroupController } from '@/modules/system/group/admin/controllers/group.controller';
import { AdminGroupService } from '@/modules/system/group/admin/services/group.service';
import { Auth } from '@/common/auth/utils';

describe('AdminGroupController', () => {
  let controller: AdminGroupController;
  let service: any;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      getList: jest.fn(),
      getSimpleList: jest.fn(),
      getOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    jest.spyOn(Auth, 'id').mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminGroupController],
      providers: [
        { provide: AdminGroupService, useValue: service },
      ],
    }).compile();

    controller = module.get<AdminGroupController>(AdminGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createGroup', () => {
    it('should call service.create with owner_id from Auth', async () => {
      const body = { type: 'T', code: 'C', name: 'N', context_id: 1 };
      await controller.createGroup(body);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({ owner_id: 1 }),
      );
    });
  });

  describe('updateGroup', () => {
    it('should call service.update', async () => {
      await controller.updateGroup(10, { name: 'New' });
      expect(service.update).toHaveBeenCalledWith(10, { name: 'New' });
    });
  });

  describe('deleteGroup', () => {
    it('should call service.delete', async () => {
      await controller.deleteGroup(10);
      expect(service.delete).toHaveBeenCalledWith(10);
    });
  });
});
