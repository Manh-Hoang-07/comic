import { IsArray, IsEmail, IsOptional, IsString, MinLength, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { UserProfilePayloadDto } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  role_ids?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfilePayloadDto)
  profile?: UserProfilePayloadDto;
}
