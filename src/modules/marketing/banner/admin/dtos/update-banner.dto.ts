import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';
import { BannerLinkTarget } from '@/shared/enums/types/banner-link-target.enum';

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  mobile_image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  link?: string;

  @IsOptional()
  @IsEnum(BannerLinkTarget)
  link_target?: BannerLinkTarget;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  button_text?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  button_color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  text_color?: string;

  @IsOptional()
  @IsPrimaryKey()
  location_id?: any;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sort_order?: number;

  @IsOptional()
  status?: BasicStatus;

  @IsOptional()
  @Type(() => Date)
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  end_date?: Date;
}
