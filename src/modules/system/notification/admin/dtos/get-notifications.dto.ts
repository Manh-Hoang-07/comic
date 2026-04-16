import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { NotificationType } from '@/shared/enums/types/notification-type.enum';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';

export class GetNotificationsDto {
  @IsOptional()
  @IsPrimaryKey()
  user_id?: any;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(BasicStatus)
  status?: BasicStatus;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @IsOptional()
  @IsBoolean()
  include_deleted?: boolean;
}
