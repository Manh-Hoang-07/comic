import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IEmailConfigRepository,
  EMAIL_CONFIG_REPOSITORY,
} from '../../domain/repositories/email-config.repository';
import { UpdateEmailConfigDto } from '../dtos/update-email-config.dto';
import { BaseService } from '@/common/core/services';
import { buildConfigPayload } from '@/modules/system/system-config/utils/config-payload.helper';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';

@Injectable()
export class EmailConfigService extends BaseService<
  any,
  IEmailConfigRepository
> {
  constructor(
    @Inject(EMAIL_CONFIG_REPOSITORY)
    private readonly emailConfigRepo: IEmailConfigRepository,
  ) {
    super(emailConfigRepo);
  }

  async getConfig(): Promise<any> {
    const config = await this.emailConfigRepo.getConfig();
    return this.transform(config, true);
  }

  /**
   * Upsert email configuration.
   */
  async updateConfig(dto: UpdateEmailConfigDto): Promise<any> {
    const userId = getCurrentUserId();
    const existing = await this.emailConfigRepo.getConfig();

    // Mask password if it was not provided in the update
    if (existing && !dto.smtp_password) {
      delete (dto as any).smtp_password;
    }

    const payload = buildConfigPayload(dto, [], userId ?? undefined, existing);

    let result: any;
    if (!existing) {
      result = await this.emailConfigRepo.create({
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_secure: true,
        ...payload,
      });
    } else {
      result = await this.emailConfigRepo.update(existing.id, payload);
    }

    if (!result) {
      throw new InternalServerErrorException('Failed to update email config');
    }

    return this.transform(result, true);
  }

  protected transform(config: any, maskPassword = false) {
    const item = { ...config } as any;
    if (item && maskPassword && item.smtp_password) {
      item.smtp_password = '******';
    }
    return item;
  }
}
