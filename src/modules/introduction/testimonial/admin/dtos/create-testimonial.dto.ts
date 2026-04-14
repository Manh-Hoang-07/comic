import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  client_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  client_position?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  client_company?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  client_avatar?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsPrimaryKey()
  @IsOptional()
  project_id?: any;

  @IsBoolean()
  @IsOptional()
  featured?: boolean = false;

  @IsOptional()
  status?: BasicStatus = BasicStatus.active;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sort_order?: number = 0;
}
