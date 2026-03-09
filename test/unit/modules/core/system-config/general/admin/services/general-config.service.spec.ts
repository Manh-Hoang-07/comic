import { Test, TestingModule } from '@nestjs/testing';
import { GeneralConfigService } from '@/modules/core/system-config/general/admin/services/general-config.service';
import { GENERAL_CONFIG_REPOSITORY } from '@/modules/core/system-config/general/domain/repositories/general-config.repository';
import { CacheService } from '@/common/cache/services';
import * as authContextHelper from '@/common/auth/utils/auth-context.helper';

jest.mock('@/common/auth/utils/auth-context.helper');


describe('GeneralConfigService', () => {
    let service: GeneralConfigService;
    let generalConfigRepo: any;
    let cacheService: any;

    beforeEach(async () => {
        generalConfigRepo = {
            getConfig: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            toPrimaryKey: jest.fn((id) => id),
        };

        cacheService = {
            del: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GeneralConfigService,
                { provide: GENERAL_CONFIG_REPOSITORY, useValue: generalConfigRepo },
                { provide: CacheService, useValue: cacheService },
            ],
        }).compile();

        service = module.get<GeneralConfigService>(GeneralConfigService);
        (authContextHelper.getCurrentUserId as jest.Mock).mockReturnValue(100);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getConfig', () => {
        it('should return config from repo and convert BigInt', async () => {
            const mockConfig = { id: 1n, site_name: 'Test' };
            generalConfigRepo.getConfig.mockResolvedValue(mockConfig);
            const result = await service.getConfig();
            expect(result.site_name).toBe('Test');
            expect(result.id).toBe(1);
        });
    });

    describe('updateConfig', () => {
        it('should create new config and invalidate cache', async () => {
            generalConfigRepo.getConfig.mockResolvedValue(null);
            generalConfigRepo.create.mockResolvedValue({ id: 1n, site_name: 'New' });

            const result = await service.updateConfig({ site_name: 'New' } as any);

            expect(generalConfigRepo.create).toHaveBeenCalled();
            expect(result.id).toBe(1);
            expect(cacheService.del).toHaveBeenCalledWith('public:general-config');
        });

        it('should update existing config and invalidate cache', async () => {
            const existing = { id: 1n, site_name: 'Old' };
            generalConfigRepo.getConfig.mockResolvedValue(existing);
            generalConfigRepo.update.mockResolvedValue({ ...existing, site_name: 'Updated' });

            await service.updateConfig({ site_name: 'Updated' } as any);

            expect(generalConfigRepo.update).toHaveBeenCalled();
            expect(cacheService.del).toHaveBeenCalledWith('public:general-config');
        });
    });
});




