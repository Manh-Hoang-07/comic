import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { BookmarksService } from '@/modules/comics/bookmark/user/services/bookmarks.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';

@Controller('user/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Permission('user')
  @Get()
  async getList() {
    return this.bookmarksService.getList();
  }

  @Permission('user')
  @Post()
  async create(
    @Body(ValidationPipe) body: { chapter_id: any; page_number: any },
  ) {
    return this.bookmarksService.createBookmark(
      body.chapter_id,
      body.page_number,
    );
  }

  @Permission('user')
  @Delete(':id')
  async delete(@Param('id') id: any) {
    return this.bookmarksService.removeBookmark(id);
  }
}
