import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UserChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  old_password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
