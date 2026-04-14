import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { MenuType } from '@/shared/enums/types/menu-type.enum';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty({ message: 'Menu code is required' })
  @Length(3, 120, { message: 'Menu code must be between 3 and 120 characters' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Menu name is required' })
  @MaxLength(150, { message: 'Menu name must not exceed 150 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Path must not exceed 255 characters' })
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'API path must not exceed 255 characters' })
  api_path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Icon must not exceed 120 characters' })
  icon?: string;

  @IsOptional()
  @IsEnum(MenuType, { message: 'Type must be one of: route, group, link' })
  type?: MenuType;

  @IsOptional()
  @IsEnum(BasicStatus, { message: 'Status must be one of: active, inactive' })
  status?: BasicStatus;

  @IsOptional()
  @IsPrimaryKey()
  parent_id?: any;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_public?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  show_in_menu?: boolean;

  @IsOptional()
  @IsPrimaryKey()
  required_permission_id?: any;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Group must not exceed 50 characters' })
  group?: string;
}
