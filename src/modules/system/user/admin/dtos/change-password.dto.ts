import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu mới',
    minLength: 6,
    example: 'NewP@ssw0rd123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
