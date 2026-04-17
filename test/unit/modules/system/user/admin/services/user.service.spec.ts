import { Test, type TestingModule } from '@nestjs/testing';
import { UserService } from '@/modules/system/user/admin/services/user.service';
import { PolicyService } from '@/modules/system/user/admin/services/policy.service';
import { PasswordService } from '@/modules/system/user/admin/services/password.service';
import { RelationService } from '@/modules/system/user/admin/services/relation.service';
import { USER_REPOSITORY } from '@/modules/system/user/domain/user.repository';
import { GROUP_REPOSITORY } from '@/modules/system/group/domain/group.repository';
import { UserRoleScopeService } from '@/modules/system/user/admin/services/user-role-scope.service';
jest.mock('@/common/auth/utils/auth-context.helper', () => ({
  getCurrentUserId: jest.fn().mockReturnValue(42),
}));

describe('UserService (admin)', () => {
  let moduleRef: TestingModule;
  let service: UserService;
  let userRepo: {
    findById: jest.Mock;
    findAssignments: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  let policy: {
    assertAccess: jest.Mock;
    roleScope: jest.Mock;
    assertUnique: jest.Mock;
  };
  let passwordService: { changePassword: jest.Mock; hash: jest.Mock };
  let relationService: { sync: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      findAssignments: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };
    policy = {
      assertAccess: jest.fn().mockResolvedValue(undefined),
      roleScope: jest.fn(),
      assertUnique: jest.fn().mockResolvedValue(undefined),
    };
    passwordService = {
      changePassword: jest.fn().mockResolvedValue({ ok: true }),
      hash: jest.fn().mockResolvedValue('hashed'),
    };
    relationService = { sync: jest.fn().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        UserRoleScopeService,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: GROUP_REPOSITORY, useValue: {} },
        { provide: PolicyService, useValue: policy },
        { provide: PasswordService, useValue: passwordService },
        { provide: RelationService, useValue: relationService },
      ],
    }).compile();

    service = moduleRef.get(UserService);
  });

  describe('prepareFilters', () => {
    it('delegates to UserRoleScopeService.mergeListFilter', async () => {
      const scope = moduleRef.get(UserRoleScopeService);
      const spy = jest
        .spyOn(scope, 'mergeListFilter')
        .mockReturnValue({ merged: true } as any);

      const out = await (service as any).prepareFilters({ search: 'x' });

      expect(spy).toHaveBeenCalledWith({ search: 'x' });
      expect(out).toEqual({ merged: true });
    });
  });

  describe('transform', () => {
    it('removes password from entity', () => {
      const row = (service as any).transform({
        id: 1,
        email: 'a@b.com',
        password: 'x',
      });
      expect(row).toEqual({ id: 1, email: 'a@b.com' });
    });
  });

  describe('create', () => {
    it('hashes password, asserts unique, strips profile, syncs relations', async () => {
      userRepo.create.mockResolvedValue({ id: 7, email: 'n@test.com' });

      await service.create({
        email: 'n@test.com',
        password: 'plain',
        profile: { upsert: { create: { about: 'hi' }, update: {} } },
      } as any);

      expect(policy.assertUnique).toHaveBeenCalled();
      expect(passwordService.hash).toHaveBeenCalledWith('plain');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'n@test.com',
          password: 'hashed',
          created_user_id: 42,
        }),
      );
      const createArg = userRepo.create.mock.calls[0][0];
      expect(createArg.profile).toBeUndefined();
      expect(relationService.sync).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ profile: expect.anything() }),
      );
    });
  });

  describe('update', () => {
    it('asserts access, omits password when absent, syncs relations', async () => {
      userRepo.update.mockResolvedValue({ id: 3, name: 'U' });

      await service.update(3, { name: 'U' } as any);

      expect(policy.assertAccess).toHaveBeenCalledWith(3);
      expect(userRepo.update).toHaveBeenCalledWith(
        3,
        expect.not.objectContaining({ password: expect.anything() }),
      );
      expect(relationService.sync).toHaveBeenCalledWith(3, { name: 'U' });
    });
  });

  describe('delete', () => {
    it('asserts access then deletes', async () => {
      userRepo.delete.mockResolvedValue(true);

      await service.delete(8);

      expect(policy.assertAccess).toHaveBeenCalledWith(8);
      expect(userRepo.delete).toHaveBeenCalledWith(8);
    });
  });

  describe('changePassword', () => {
    it('asserts access then delegates to PasswordService', async () => {
      const dto = { password: 'x' } as any;
      await service.changePassword(7, dto);

      expect(policy.assertAccess).toHaveBeenCalledWith(7);
      expect(passwordService.changePassword).toHaveBeenCalledWith(7, dto);
    });
  });

  describe('getOne', () => {
    it('asserts access then loads user via repository', async () => {
      userRepo.findById.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        password: 'x',
      });

      const row = await service.getOne(1);

      expect(policy.assertAccess).toHaveBeenCalledWith(1);
      expect(userRepo.findById).toHaveBeenCalledWith(1, {});
      expect(row).toEqual({ id: 1, email: 'a@b.com' });
    });
  });
});
