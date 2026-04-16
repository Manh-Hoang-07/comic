import { Test, TestingModule } from '@nestjs/testing';
import { EmailConfigService } from '@/modules/system/system-config/email/admin/services/email-config.service';
import { EMAIL_CONFIG_REPOSITORY } from '@/modules/system/system-config/email/domain/repositories/email-config.repository';
import * as authContextHelper from '@/common/auth/utils/auth-context.helper';

jest.mock('@/common/auth/utils/auth-context.helper');

describe('EmailConfigService', () => {
  let service: EmailConfigService;
  let emailConfigRepo: any;

  beforeEach(async () => {
    emailConfigRepo = {
      getConfig: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      toPrimaryKey: jest.fn((id) => id),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailConfigService,
        { provide: EMAIL_CONFIG_REPOSITORY, useValue: emailConfigRepo },
      ],
    }).compile();

    service = module.get<EmailConfigService>(EmailConfigService);
    (authContextHelper.getCurrentUserId as jest.Mock).mockReturnValue(100);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return config with masked password', async () => {
      emailConfigRepo.getConfig.mockResolvedValue({
        id: 1,
        smtp_password: 'secret_password',
      });
      const result = await service.getConfig();
      expect(result.smtp_password).toBe('******');
    });

    it('should return null if no config found', async () => {
      emailConfigRepo.getConfig.mockResolvedValue(null);
      const result = await service.getConfig();
      expect(result).toBeNull();
    });
  });

  describe('updateConfig', () => {
    it('should create new config if none exists', async () => {
      emailConfigRepo.getConfig.mockResolvedValue(null);
      emailConfigRepo.create.mockResolvedValue({
        id: 1n,
        smtp_host: 'smtp.test.com',
      });

      const dto = { smtp_host: 'smtp.test.com', smtp_username: 'user' };
      const result = await service.updateConfig(dto as any);

      expect(emailConfigRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          smtp_host: 'smtp.test.com',
          created_user_id: 100n,
        }),
      );
      expect(result.id).toBe(1);
    });

    it('should update existing config', async () => {
      const existing = {
        id: 1n,
        smtp_host: 'old.host.com',
        updated_user_id: 1n,
      };
      emailConfigRepo.getConfig.mockResolvedValue(existing);
      emailConfigRepo.update.mockResolvedValue({
        ...existing,
        smtp_host: 'new.host.com',
      });

      const dto = { smtp_host: 'new.host.com' };
      await service.updateConfig(dto as any);

      expect(emailConfigRepo.update).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({
          smtp_host: 'new.host.com',
          updated_user_id: 100n,
        }),
      );
    });

    it('should keep old password if not provided in dto', async () => {
      const existing = { id: 1n, smtp_password: 'saved_password' };
      emailConfigRepo.getConfig.mockResolvedValue(existing);
      emailConfigRepo.update.mockResolvedValue(existing);

      await service.updateConfig({ smtp_host: 'new.host.com' } as any);

      expect(emailConfigRepo.update).toHaveBeenCalledWith(
        1n,
        expect.not.objectContaining({
          smtp_password: expect.anything(),
        }),
      );
    });
  });
});
