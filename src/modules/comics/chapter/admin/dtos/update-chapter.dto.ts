import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { IsPrimaryKey } from '@/common/shared/decorators';
import { ChapterStatus } from '@/shared/enums';

export class UpdateChapterDto {
  @IsOptional()
  @IsPrimaryKey()
  team_id?: any;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  chapter_index?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  chapter_label?: string;

  @IsOptional()
  @IsEnum(ChapterStatus)
  status?: ChapterStatus;
}
