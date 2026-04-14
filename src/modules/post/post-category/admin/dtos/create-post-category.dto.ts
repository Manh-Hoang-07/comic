import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';

export class CreatePostCategoryDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsPrimaryKey()
  parent_id?: any;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsString()
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  @IsString()
  canonical_url?: string;

  @IsOptional()
  @IsString()
  og_image?: string;
}
