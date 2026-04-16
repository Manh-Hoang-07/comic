import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PasswordService } from '@/modules/system/user/admin/services/password.service';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';

jest.mock('bcryptjs', () => ({
  hash: jest
    .fn()
    .mockImplementation((pwd: string, rounds: number) =>
      Promise.resolve(`hashed:${pwd}:${rounds}`),
    ),
}));

import * as bcrypt from 'bcryptjs';

describe('PasswordService (admin)', () => {
  let service: PasswordService;
  let userRepo: { findById: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        { provide: USER_REPOSITORY, useValue: userRepo },
      ],
    }).compile();

    service = module.get(PasswordService);
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('uses bcrypt with cost 10', async () => {
      const out = await service.hash('secret');
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(out).toContain('hashed:secret:10');
    });
  });

  describe('changePassword', () => {
    it('throws when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.changePassword(1, { password: 'new' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('hashes password and updates user', async () => {
      userRepo.findById.mockResolvedValue({ id: 1, email: 'a@b.com' });

      const result = await service.changePassword(1, {
        password: 'newPass',
      } as any);

      expect(userRepo.update).toHaveBeenCalledWith(1, {
        password: expect.stringContaining('hashed:newPass'),
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
    });
  });
});
