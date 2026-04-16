import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IGeneralConfigRepository,
  GENERAL_CONFIG_REPOSITORY,
} from '../../domain/repositories/general-config.repository';
import { UpdateGeneralConfigDto } from '../dtos/update-general-config.dto';
import { CacheService } from '@/common/cache/services';
import { BaseService } from '@/common/core/services';
import { buildConfigPayload } from '@/modules/system/system-config/utils/config-payload.helper';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';

@Injectable()
export class GeneralConfigService extends BaseService<
  any,
  IGeneralConfigRepository
> {
  private readonly PUBLIC_CACHE_KEY = 'public:general-config';

  constructor(
    @Inject(GENERAL_CONFIG_REPOSITORY)
    private readonly generalConfigRepo: IGeneralConfigRepository,
    private readonly cacheService: CacheService,
  ) {
    super(generalConfigRepo);
  }

  async getConfig(): Promise<any> {
    const config = await this.generalConfigRepo.getConfig();
    return this.transform(config);
  }

  /**
   * Upsert general configuration.
   */
  async updateConfig(dto: UpdateGeneralConfigDto): Promise<any> {
    const userId = getCurrentUserId();
    const existing = await this.generalConfigRepo.getConfig();

    const bigIntFields = [
      'site_country_id',
      'site_province_id',
      'site_ward_id',
    ];

    const payload = buildConfigPayload(
      dto,
      bigIntFields,
      userId ?? undefined,
      existing,
    );

    let result: any;
    if (!existing) {
      result = await this.generalConfigRepo.create({
        ...payload,
        site_name: payload.site_name || 'My Website',
        timezone: payload.timezone || 'Asia/Ho_Chi_Minh',
        locale: payload.locale || 'vi',
        currency: payload.currency || 'VND',
      });
    } else {
      result = await this.generalConfigRepo.update(existing.id, payload);
    }

    if (!result) {
      throw new InternalServerErrorException(
        'Failed to create or update general config',
      );
    }

    await this.invalidateCache();

    return this.transform(result);
  }

  private async invalidateCache(): Promise<void> {
    if (this.cacheService?.del) {
      await this.cacheService.del(this.PUBLIC_CACHE_KEY).catch(() => undefined);
    }
  }
}
