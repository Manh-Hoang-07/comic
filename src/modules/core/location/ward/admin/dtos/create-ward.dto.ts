import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';

export class CreateWardDto {
  @IsNotEmpty()
  @IsPrimaryKey()
  province_id: any;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  type: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  status?: string;
}
