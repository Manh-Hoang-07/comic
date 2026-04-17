import { Test, TestingModule } from '@nestjs/testing';
import { UserGroupController } from '@/modules/system/group/user/controllers/group.controller';
import { UserGroupService } from '@/modules/system/group/user/services/group.service';
import { Auth } from '@/common/auth/utils';

describe('UserGroupController', () => {
  let controller: UserGroupController;
  let service: any;

  beforeEach(async () => {
    service = { getUserGroups: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserGroupController],
      providers: [
        { provide: UserGroupService, useValue: service },
      ],
    }).compile();

    controller = module.get<UserGroupController>(UserGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyGroups', () => {
    it('should return groups from service', async () => {
      jest.spyOn(Auth, 'id').mockReturnValue(1);
      service.getUserGroups.mockResolvedValue([{ id: 10, name: 'Group 1' }]);

      const result = await controller.getMyGroups();
      expect(result).toBeDefined();
      if (result && result.length > 0) {
        expect((result[0] as any).name).toBe('Group 1');
      }
    });

    it('should return empty if no userId', async () => {
      jest.spyOn(Auth, 'id').mockReturnValue(null);
      expect(await controller.getMyGroups()).toEqual([]);
    });
  });
});
