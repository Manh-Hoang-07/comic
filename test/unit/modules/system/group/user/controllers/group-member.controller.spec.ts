import { Test, TestingModule } from '@nestjs/testing';
import { GroupMemberController } from '@/modules/system/group/user/controllers/group-member.controller';
import { UserGroupService } from '@/modules/system/group/user/services/group.service';
import { Auth } from '@/common/auth/utils';
import { ForbiddenException } from '@nestjs/common';

describe('GroupMemberController', () => {
  let controller: GroupMemberController;
  let service: any;

  beforeEach(async () => {
    service = {
      addMember: jest.fn(),
      assignRolesToMember: jest.fn(),
      removeMember: jest.fn(),
      getGroupMembers: jest.fn(),
    };
    jest.spyOn(Auth, 'id').mockReturnValue(1);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupMemberController],
      providers: [
        { provide: UserGroupService, useValue: service },
      ],
    }).compile();

    controller = module.get<GroupMemberController>(GroupMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addMember', () => {
    it('should throw ForbiddenException if no userId', async () => {
      jest.spyOn(Auth, 'id').mockReturnValue(null);
      await expect(
        controller.addMember(10, { user_id: 5, role_ids: [] }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call service.addMember', async () => {
      await controller.addMember(10, { user_id: 5, role_ids: [1, 2] });
      expect(service.addMember).toHaveBeenCalledWith(10, 5, [1, 2], 1);
    });
  });

  describe('removeMember', () => {
    it('should call service.removeMember', async () => {
      await controller.removeMember(10, 5);
      expect(service.removeMember).toHaveBeenCalledWith(10, 5, 1);
    });
  });
});
