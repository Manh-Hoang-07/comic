import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '@/modules/system/user/user/controllers/profile.controller';
import { ProfileService } from '@/modules/system/user/user/services/profile.service';
import { Auth } from '@/common/auth/utils';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('@/common/auth/utils', () => ({
  Auth: {
    id: jest.fn(),
    user: jest.fn(),
  },
}));

describe('ProfileController', () => {
  let controller: ProfileController;
  let service: any;

  beforeEach(async () => {
    service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: service }],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should throw UnauthorizedException if no userId', async () => {
      (Auth.id as jest.Mock).mockReturnValue(null);
      await expect(controller.getMe()).rejects.toThrow(UnauthorizedException);
    });

    it('should return profile from service', async () => {
      const fakeUser = { id: 1, name: 'Me' };
      (Auth.id as jest.Mock).mockReturnValue(1);
      (Auth.user as jest.Mock).mockReturnValue(fakeUser);
      service.getProfile.mockResolvedValue(fakeUser);
      const result = await controller.getMe();
      expect(service.getProfile).toHaveBeenCalledWith(1, fakeUser);
      expect(result.name).toBe('Me');
    });
  });

  describe('updateMe', () => {
    it('should delegate to service.updateProfile', async () => {
      (Auth.id as jest.Mock).mockReturnValue(1);
      const dto = { name: 'New Name', birthday: '1990-01-01' };
      await controller.updateMe(dto as any);
      expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('changePassword', () => {
    it('should delegate to service.changePassword', async () => {
      (Auth.id as jest.Mock).mockReturnValue(1);
      const dto = { old_password: 'old', password: 'new' };
      await controller.changePassword(dto as any);
      expect(service.changePassword).toHaveBeenCalledWith(1, 'old', 'new');
    });
  });
});
