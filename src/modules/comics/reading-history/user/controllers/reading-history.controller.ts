import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import { ReadingHistoryService } from '../services/reading-history.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';

@Controller('user/reading-history')
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @Permission('user')
  @Get()
  async getList() {
    return this.readingHistoryService.getList();
  }

  @Permission('user')
  @Post()
  async updateOrCreate(
    @Body(ValidationPipe) body: { comic_id: any; chapter_id: any },
  ) {
    return this.readingHistoryService.updateOrCreate(
      body.comic_id,
      body.chapter_id,
    );
  }

  @Permission('user')
  @Delete(':comicId')
  async delete(@Param('comicId') comicId: any) {
    return this.readingHistoryService.clearHistory(comicId);
  }
}
