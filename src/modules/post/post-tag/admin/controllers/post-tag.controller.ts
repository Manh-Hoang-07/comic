import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { PostTagService } from '@/modules/post/post-tag/admin/services/post-tag.service';
import { CreatePostTagDto } from '@/modules/post/post-tag/admin/dtos/create-post-tag.dto';
import { UpdatePostTagDto } from '@/modules/post/post-tag/admin/dtos/update-post-tag.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';

@Controller('admin/post-tags')
export class PostTagController {
  constructor(private readonly postTagService: PostTagService) {}

  @Permission('post_tag.manage')
  @Get()
  async getList(@Query(ValidationPipe) query: any) {
    return this.postTagService.getList(query);
  }

  @Permission('post_tag.manage')
  @Get('simple')
  async getSimpleList(@Query(ValidationPipe) query: any) {
    return this.postTagService.getSimpleList(query);
  }

  @Permission('post_tag.manage')
  @Get(':id')
  async getOne(@Param('id') id: any) {
    return this.postTagService.getOne(id);
  }

  @Permission('post_tag.manage')
  @LogRequest()
  @Post()
  async create(@Body(ValidationPipe) createDto: CreatePostTagDto) {
    return this.postTagService.create(createDto as any);
  }

  @Permission('post_tag.manage')
  @LogRequest()
  @Put(':id')
  async update(
    @Param('id') id: any,
    @Body(ValidationPipe) updateDto: UpdatePostTagDto,
  ) {
    return this.postTagService.update(id, updateDto as any);
  }

  @Permission('post_tag.manage')
  @LogRequest()
  @Delete(':id')
  async delete(@Param('id') id: any) {
    return this.postTagService.delete(id);
  }
}
