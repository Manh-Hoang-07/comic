import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPrimaryKey } from '@/common/shared/decorators';

export class UserProfilePayloadDto {
  @ApiPropertyOptional({
    description: 'Ngày sinh (YYYY-MM-DD)',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsString()
  birthday?: string;

  @ApiPropertyOptional({ description: 'Giới tính', example: 'male' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ID Quốc gia' })
  @IsOptional()
  @IsPrimaryKey()
  country_id?: any;

  @ApiPropertyOptional({ description: 'ID Tỉnh/Thành phố' })
  @IsOptional()
  @IsPrimaryKey()
  province_id?: any;

  @ApiPropertyOptional({ description: 'ID Phường/Xã' })
  @IsOptional()
  @IsPrimaryKey()
  ward_id?: any;

  @ApiPropertyOptional({ description: 'Giới thiệu bản thân' })
  @IsOptional()
  @IsString()
  about?: string;
}

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'Tên đăng nhập', example: 'admin_test' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại', example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Mật khẩu',
    minLength: 6,
    example: 'P@ssw0rd123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn ảnh đại diện' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Thông tin hồ sơ bổ sung',
    type: UserProfilePayloadDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfilePayloadDto)
  profile?: UserProfilePayloadDto;
}
