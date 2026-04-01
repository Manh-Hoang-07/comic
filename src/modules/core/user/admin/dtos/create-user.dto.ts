import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsPrimaryKey } from '@/common/shared/decorators';

export class UserProfilePayloadDto {
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

export class CreateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  role_ids?: any[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfilePayloadDto)
  profile?: UserProfilePayloadDto;
}
