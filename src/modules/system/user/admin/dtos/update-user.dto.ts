import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserProfilePayloadDto } from './create-user.dto';

export class UpdateUserDto {
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

  @ApiPropertyOptional({
    description: 'Mật khẩu mới',
    minLength: 6,
    example: 'NewP@ssw0rd',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

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
