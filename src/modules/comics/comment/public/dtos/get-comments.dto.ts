import { IsPrimaryKey } from '@/common/shared/decorators';

export class GetCommentsByComicDto {
  @IsPrimaryKey()
  comicId: any;
}

export class GetCommentsByChapterDto {
  @IsPrimaryKey()
  chapterId: any;
}
