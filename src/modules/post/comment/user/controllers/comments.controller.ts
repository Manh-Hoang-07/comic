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
  UsePipes,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserPostCommentsService } from '../services/comments.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';
import { SanitizeHtmlPipe } from '@/modules/post/shared/pipes/sanitize-html.pipe';

@Controller('user/post-comments')
export class UserPostCommentsController {
  constructor(private readonly commentsService: UserPostCommentsService) {}

  @Permission('user')
  @Get()
  async getMyComments(
    @Query('page', new ParseIntPipe({ optional: true })) page: any = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: any = 20,
  ) {
    return this.commentsService.getList({ by_current_user: true, page, limit });
  }

  @Permission('user')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 comments per minute
  @Post()
  @UsePipes(new SanitizeHtmlPipe())
  async create(
    @Body(ValidationPipe)
    body: {
      post_id: any;
      parent_id?: any;
      content: string;
    },
  ) {
    // Validate post_id exists? Service handles parent validCheck. Post validCheck?
    // BaseService will try to create. If post_id invalid, FK constraint might fail.
    // Comic service didn't check comic_id explicitly in beforeCreate, only parent validity.
    return this.commentsService.create(body);
  }

  @Permission('user')
  @Put(':id')
  @UsePipes(new SanitizeHtmlPipe())
  async update(
    @Param('id') id: any,
    @Body(ValidationPipe) body: { content: string },
  ) {
    return this.commentsService.updateComment(id, body.content);
  }

  @Permission('user')
  @Delete(':id')
  async delete(@Param('id') id: any) {
    return this.commentsService.removeComment(id);
  }
}
