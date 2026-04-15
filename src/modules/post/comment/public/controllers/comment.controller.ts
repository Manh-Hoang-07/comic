import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { PostCommentService } from '../services/comment.service';
import { Permission } from '@/common/auth/decorators';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Controller('public/posts/:postId/comments')
@Permission('public')
export class PostCommentController {
  constructor(private readonly commentService: PostCommentService) {}

  @Get()
  @Permission('public')
  async getComments(
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.commentService.getCommentsByPost(postId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  @Post()
  @Permission('user')
  async createComment(
    @Param('postId') postId: string,
    @Body() body: { content: string; parent_id?: string },
    @Req() req: any,
  ) {
    return this.commentService.createComment({
      post_id: toPrimaryKey(postId),
      user_id: req.user.id,
      content: body.content,
      parent_id: body.parent_id ? toPrimaryKey(body.parent_id) : undefined,
    });
  }
}
