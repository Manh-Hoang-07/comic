import { Controller, Get, Body, ValidationPipe, Post } from '@nestjs/common';
import { EmailConfigService } from '../services/email-config.service';
import { UpdateEmailConfigDto } from '../dtos/update-email-config.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';

@Controller('admin/system-configs/email')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  /**
   * Lấy cấu hình email
   */
  @Permission('config.manage')
  @Get()
  getConfig() {
    return this.emailConfigService.getConfig();
  }

  /**
   * Cập nhật cấu hình email
   */
  @Permission('config.manage')
  @LogRequest()
  @Post()
  updateConfig(@Body(ValidationPipe) dto: UpdateEmailConfigDto) {
    return this.emailConfigService.updateConfig(dto);
  }
}
