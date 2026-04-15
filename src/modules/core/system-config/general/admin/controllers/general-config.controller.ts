import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  UseInterceptors,
} from '@nestjs/common';
import { GeneralConfigService } from '../services/general-config.service';
import { UpdateGeneralConfigDto } from '../dtos/update-general-config.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { CacheInterceptor, CacheEvict } from '@/common/cache';

@Controller('admin/system-configs/general')
@UseInterceptors(CacheInterceptor)
export class GeneralConfigController {
  constructor(private readonly generalConfigService: GeneralConfigService) {}

  /**
   * Lấy cấu hình chung
   */
  @Permission('config.manage')
  @Get()
  getConfig() {
    return this.generalConfigService.getConfig();
  }

  /**
   * Cập nhật cấu hình chung
   */
  @Permission('config.manage')
  @LogRequest()
  @Post()
  @CacheEvict({ keys: ['system:configs:general'] })
  updateConfig(@Body(ValidationPipe) dto: UpdateGeneralConfigDto) {
    return this.generalConfigService.updateConfig(dto);
  }
}
