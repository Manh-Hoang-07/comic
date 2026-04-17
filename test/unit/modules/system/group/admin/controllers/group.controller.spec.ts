import { Test, TestingModule } from '@nestjs/testing';
import { AdminGroupController } from '@/modules/system/group/admin/controllers/group.controller';
import { AdminGroupService } from '@/modules/system/group/admin/services/group.service';
import { Auth } from '@/common/auth/utils';
import { RequestContext } from '@/common/shared/utils';
import { ForbiddenException } from '@nestjs/common';

describe('AdminGroupController', () => {
  let controller: AdminGroupController;
  let service: any;

  beforeEach(async () => {
    service = {
      createGroup: jest.fn(),
      getList: jest.fn(),
      findById: jest.fn(),
      isSystemAdmin: jest.fn(),
      update: jest.fn(),
      deleteGroup: jest.fn(),
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
    it('should throw ForbiddenException if no userId', async () => {
      jest.spyOn(Auth, 'id').mockReturnValue(null);
      await expect(
        controller.createGroup({
          type: 'T',
          code: 'C',
          name: 'N',
          context_id: 1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call service.createGroup with userId as owner', async () => {
      const body = { type: 'T', code: 'C', name: 'N', context_id: 1 };
      await controller.createGroup(body);
      expect(service.createGroup).toHaveBeenCalledWith(
        expect.objectContaining({ owner_id: 1 }),
        1,
      );
    });
  });

  describe('updateGroup', () => {
    it('should throw ForbiddenException if not system admin', async () => {
      service.isSystemAdmin.mockResolvedValue(false);
      await expect(controller.updateGroup(10, { name: 'New' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should call update if system admin', async () => {
      service.isSystemAdmin.mockResolvedValue(true);
      jest.spyOn(RequestContext, 'get').mockImplementation((key: string) => {
        if (key === 'context') return { type: 'system' };
        return undefined;
      });
      await controller.updateGroup(10, { name: 'New' });
      expect(service.update).toHaveBeenCalledWith(10, { name: 'New' });
    });
  });
});
