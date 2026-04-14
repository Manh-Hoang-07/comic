import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { FollowsService } from '../services/follows.service';
import { Permission } from '@/common/auth/decorators/rbac.decorators';

@Controller('user/follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Permission('user')
  @Get()
  async getList() {
    return this.followsService.getList();
  }

  @Permission('user')
  @Post('comics/:comicId')
  async follow(@Param('comicId') comicId: any) {
    return this.followsService.follow(comicId);
  }

  @Permission('user')
  @Delete('comics/:comicId')
  async unfollow(@Param('comicId') comicId: any) {
    return this.followsService.unfollow(comicId);
  }

  @Permission('user')
  @Get('comics/:comicId/is-following')
  async isFollowing(@Param('comicId') comicId: any) {
    return { is_following: await this.followsService.isFollowing(comicId) };
  }
}
