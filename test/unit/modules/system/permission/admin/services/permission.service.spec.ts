import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '@/modules/system/permission/admin/services/permission.service';
import { PERMISSION_REPOSITORY } from '@/modules/system/permission/domain/permission.repository';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as authContextHelper from '@/common/auth/utils/auth-context.helper';

jest.mock('@/common/auth/utils/auth-context.helper');

describe('PermissionService', () => {
  let service: PermissionService;
  let repo: any;
  let rbacCache: any;

  beforeEach(async () => {
    repo = {
      findByCode: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    rbacCache = {
      bumpVersion: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: PERMISSION_REPOSITORY, useValue: repo },
        { provide: RbacCacheService, useValue: rbacCache },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    (authContextHelper.getCurrentUserId as jest.Mock).mockReturnValue(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('beforeCreate', () => {
    it('should throw BadRequestException if permission code exists', async () => {
      repo.findByCode.mockResolvedValue({ id: 1n });
      await expect(
        (service as any).beforeCreate({ code: 'admin' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return prepared payload if code is unique', async () => {
      repo.findByCode.mockResolvedValue(null);

      const data = { code: 'admin', parent_id: 1 };
      const result = await (service as any).beforeCreate(data);

      expect(result.parent_id).toBe(1n);
      expect(result.created_user_id).toBe(1);
    });
  });

  describe('beforeUpdate', () => {
    it('should throw NotFoundException if permission not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect((service as any).beforeUpdate(1n, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if new code already exists', async () => {
      repo.findById.mockResolvedValue({ code: 'old' });
      repo.findByCode.mockResolvedValue({ id: 2n });

      await expect(
        (service as any).beforeUpdate(1n, { code: 'new' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return prepared payload and convert BigInt', async () => {
      repo.findById.mockResolvedValue({ code: 'old' });
      const data = { code: 'new', parent_id: 5 };

      const result = await (service as any).beforeUpdate(1n, data);

      expect(result.code).toBe('new');
      expect(result.parent_id).toBe(5n);
      expect(result.updated_user_id).toBe(1);
    });
  });

  describe('afterUpdate / afterDelete', () => {
    it('should bump rbac version after update', async () => {
      await (service as any).afterUpdate();
      expect(rbacCache.bumpVersion).toHaveBeenCalled();
    });

    it('should bump rbac version after delete', async () => {
      await (service as any).afterDelete();
      expect(rbacCache.bumpVersion).toHaveBeenCalled();
    });
  });

  describe('beforeDelete', () => {
    it('should throw BadRequestException if permission has children', async () => {
      repo.count.mockResolvedValue(1);
      await expect((service as any).beforeDelete(1n)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transform', () => {
    it('should transform normally and convert BigInt', () => {
      const dbResult = {
        id: 1n,
        code: 'view',
        name: 'View',
        parent: { id: 2n, code: 'group_code', name: 'Group', status: 'active' },
      };

      const result = (service as any).transform(dbResult);

      expect(result.id).toBe(1);
      expect(result.parent).toEqual({
        id: 2,
        code: 'group_code',
        name: 'Group',
        status: 'active',
      });
    });
  });
});
