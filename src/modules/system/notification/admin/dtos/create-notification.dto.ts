import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { NotificationType } from '@/shared/enums/types/notification-type.enum';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';

export class CreateNotificationDto {
  @IsPrimaryKey()
  user_id: any;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsEnum(BasicStatus)
  status?: BasicStatus;

  @IsOptional()
  @IsPrimaryKey()
  created_user_id?: any;
}
