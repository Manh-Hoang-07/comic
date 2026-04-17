import { Test, TestingModule } from '@nestjs/testing';
import { AdminContextService } from '@/modules/system/context/admin/services/context.service';
import { CONTEXT_REPOSITORY } from '@/modules/system/context/domain/context.repository';
import { GROUP_REPOSITORY } from '@/modules/system/group/domain/group.repository';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('AdminContextService', () => {
  let service: AdminContextService;
  let contextRepo: any;
  let rbacService: any;
  let groupRepo: any;

  beforeEach(async () => {
    contextRepo = {
      findOne: jest.fn(),
      findByTypeAndRefId: jest.fn(),
      findByCode: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      toPrimaryKey: jest.fn((id) => id),
    };

    rbacService = {
      hasPermissions: jest.fn(),
      isSystemAdmin: jest.fn().mockResolvedValue(true),
    };

    groupRepo = {
      findManyRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminContextService,
        {
          provide: CONTEXT_REPOSITORY,
          useValue: contextRepo,
        },
        {
          provide: RbacService,
          useValue: rbacService,
        },
        {
          provide: GROUP_REPOSITORY,
          useValue: groupRepo,
        },
      ],
    }).compile();

    service = module.get<AdminContextService>(AdminContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call repository create', async () => {
      contextRepo.findByTypeAndRefId.mockResolvedValue(null);
      contextRepo.findByCode.mockResolvedValue(null);
      contextRepo.create.mockResolvedValue({ id: 2 });

      const result = await service.create({ type: 'test', code: 'T1' });
      expect(contextRepo.create).toHaveBeenCalled();
      expect(result.id).toBe(2);
    });
  });

  describe('beforeCreate', () => {
    it('should throw BadRequestException if context already exists by type/refId', async () => {
      contextRepo.findByTypeAndRefId.mockResolvedValue({ id: 1 });
      await expect(
        (service as any).beforeCreate({ type: 'site', ref_id: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if context already exists by code', async () => {
      contextRepo.findByTypeAndRefId.mockResolvedValue(null);
      contextRepo.findByCode.mockResolvedValue({ id: 1 });
      await expect(
        (service as any).beforeCreate({ type: 'site', code: 'EXISTING' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return valid payload', async () => {
      contextRepo.findByTypeAndRefId.mockResolvedValue(null);
      contextRepo.findByCode.mockResolvedValue(null);

      const payload = await (service as any).beforeCreate({
        type: 'branch',
        ref_id: '200',
      });
      expect(payload.type).toBe('branch');
      expect(payload.ref_id).toBe(BigInt(200));
      expect(payload.code).toBe('branch-200');
    });
  });

  describe('beforeUpdate', () => {
    it('should throw BadRequestException for system context (ID=1)', async () => {
      contextRepo.findById.mockResolvedValue({
        id: 1,
        type: 'system',
        code: 'SYSTEM_CONTEXT',
      });
      await expect((service as any).beforeUpdate(1, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if context not found', async () => {
      contextRepo.findById.mockResolvedValue(null);
      await expect((service as any).beforeUpdate(2, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('beforeDelete', () => {
    it('should throw BadRequestException for system context', async () => {
      contextRepo.findById.mockResolvedValue({ id: 1, type: 'system' });
      await expect((service as any).beforeDelete(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if context is used by groups', async () => {
      contextRepo.findById.mockResolvedValue({ id: 2, type: 'custom' });
      groupRepo.findManyRaw.mockResolvedValue([{ id: 1 }]);
      await expect((service as any).beforeDelete(2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return true if safe to delete', async () => {
      contextRepo.findById.mockResolvedValue({ id: 2, type: 'custom' });
      groupRepo.findManyRaw.mockResolvedValue([]);
      const result = await (service as any).beforeDelete(2);
      expect(result).toBe(true);
    });
  });
});
