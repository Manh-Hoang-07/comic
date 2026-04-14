import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPrimaryKey } from '@/common/shared/decorators';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn ảnh đại diện' })
  @IsOptional()
  @IsString()
  image?: string;

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

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'ID Quốc gia' })
  @IsOptional()
  @IsPrimaryKey()
  country_id?: any;

  @ApiPropertyOptional({ description: 'ID Tỉnh Thành' })
  @IsOptional()
  @IsPrimaryKey()
  province_id?: any;

  @ApiPropertyOptional({ description: 'ID Phường Xã' })
  @IsOptional()
  @IsPrimaryKey()
  ward_id?: any;

  @ApiPropertyOptional({ description: 'Giới thiệu bản thân' })
  @IsOptional()
  @IsString()
  about?: string;
}
