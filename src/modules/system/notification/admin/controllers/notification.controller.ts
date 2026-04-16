import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { NotificationService } from '@/modules/system/notification/admin/services/notification.service';
import { CreateNotificationDto } from '@/modules/system/notification/admin/dtos/create-notification.dto';
import { UpdateNotificationDto } from '@/modules/system/notification/admin/dtos/update-notification.dto';
import { GetNotificationsDto } from '@/modules/system/notification/admin/dtos/get-notifications.dto';
import { LogRequest } from '@/common/shared/decorators';

@Controller('admin/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @LogRequest()
  @Post()
  @Permission('notification.manage')
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get()
  @Permission('notification.manage')
  async getList(@Query() query: GetNotificationsDto) {
    return this.notificationService.getList(query);
  }

  @Get('simple')
  @Permission('notification.manage')
  async getSimpleList(@Query() query: GetNotificationsDto) {
    return this.notificationService.getSimpleList(query);
  }

  @Get(':id')
  @Permission('notification.manage')
  async getOne(@Param('id') id: string) {
    return this.notificationService.getOne(id);
  }

  @LogRequest()
  @Patch(':id')
  @Permission('notification.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateNotificationDto) {
    return this.notificationService.update(id, dto);
  }

  @LogRequest()
  @Delete(':id')
  @Permission('notification.manage')
  async delete(@Param('id') id: string) {
    return this.notificationService.delete(id);
  }
}
