import { Injectable } from '@nestjs/common';
import { PostStats, Prisma } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { PrismaRepository } from '@/common/core/repositories';
import {
  IPostStatsRepository,
  PostStatsFilter,
} from '../../domain/post-stats.repository';

@Injectable()
export class PostStatsRepositoryImpl
  extends PrismaRepository<
    PostStats,
    Prisma.PostStatsWhereInput,
    Prisma.PostStatsCreateInput,
    Prisma.PostStatsUpdateInput,
    Prisma.PostStatsOrderByWithRelationInput
  >
  implements IPostStatsRepository
{
  constructor(private readonly prisma: PrismaService) {
    super((prisma as any).postStats as any);
    this.isSoftDelete = false;
  }

  protected buildWhere(filter: PostStatsFilter): Prisma.PostStatsWhereInput {
    const where: Prisma.PostStatsWhereInput = {};
    if (filter.post_id) where.post_id = this.toPrimaryKey(filter.post_id);
    if (filter.group_id) {
      where.post = {
        group_id: this.toPrimaryKey(filter.group_id),
      } as any;
    }
    return where;
  }

  async sum(
    field: keyof PostStats,
    filter: PostStatsFilter = {},
  ): Promise<number> {
    const where = this.buildWhere(filter);
    const result = await (this.prisma as any).postStats.aggregate({
      where,
      _sum: {
        [field]: true,
      },
    });
    return Number(result?._sum?.[field] || 0);
  }

  async incrementViews(postId: any, count: number): Promise<void> {
    const pk = this.toPrimaryKey(postId);
    const today = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    today.setHours(0, 0, 0, 0);

    await (this.prisma as any).postStats.upsert({
      where: { post_id: pk },
      create: {
        post_id: pk,
        view_count: BigInt(count),
      },
      update: {
        view_count: { increment: BigInt(count) },
      },
    });

    await (this.prisma as any).postDailyStats.upsert({
      where: {
        post_id_stat_date: {
          post_id: pk,
          stat_date: today,
        },
      },
      create: {
        post_id: pk,
        stat_date: today,
        view_count: BigInt(count),
      },
      update: {
        view_count: { increment: BigInt(count) },
      },
    });
  }

  async getDailyViewStats(
    postId: any,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const pk = this.toPrimaryKey(postId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return (this.prisma as any).postDailyStats.findMany({
      where: {
        post_id: pk,
        stat_date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { stat_date: 'asc' },
      select: {
        post_id: true,
        stat_date: true,
        view_count: true,
        updated_at: true,
      },
    });
  }
}
