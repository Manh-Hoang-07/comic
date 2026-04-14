import { IsOptional, IsString } from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  birthday?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsPrimaryKey()
  country_id?: any;

  @IsOptional()
  @IsPrimaryKey()
  province_id?: any;

  @IsOptional()
  @IsPrimaryKey()
  ward_id?: any;

  @IsOptional()
  @IsString()
  about?: string;
}
