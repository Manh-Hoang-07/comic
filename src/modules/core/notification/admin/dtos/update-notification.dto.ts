import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { NotificationType } from '@/shared/enums/types/notification-type.enum';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';

export class UpdateNotificationDto {
  @IsOptional()
  @IsPrimaryKey()
  user_id?: any;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @IsOptional()
  @IsEnum(BasicStatus)
  status?: BasicStatus;

  @IsOptional()
  @IsPrimaryKey()
  updated_user_id?: any;
}
