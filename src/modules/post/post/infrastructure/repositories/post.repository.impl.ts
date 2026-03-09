
import { Injectable, Inject } from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { PrismaRepository } from '@/common/core/repositories';
import { IPostRepository, PostFilter } from '../../domain/post.repository';
import { RedisUtil } from '@/core/utils/redis.util';
import { IPostStatsRepository, POST_STATS_REPOSITORY } from '@/modules/post/stats/domain/post-stats.repository';

@Injectable()
export class PostRepositoryImpl extends PrismaRepository<
    Post,
    Prisma.PostWhereInput,
    Prisma.PostCreateInput,
    Prisma.PostUpdateInput,
    Prisma.PostOrderByWithRelationInput
> implements IPostRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisUtil,
        @Inject(POST_STATS_REPOSITORY)
        private readonly postStatsRepository: IPostStatsRepository,
    ) {
        super(prisma.post as unknown as any);
        this.defaultSelect = {
            id: true,
            name: true,
            slug: true,
            excerpt: true,
            content: true,
            image: true,
            cover_image: true,
            primary_postcategory_id: true,
            status: true,
            post_type: true,
            video_url: true,
            audio_url: true,
            is_featured: true,
            is_pinned: true,
            published_at: true,
            meta_title: true,
            meta_description: true,
            canonical_url: true,
            og_title: true,
            og_description: true,
            og_image: true,
            group_id: true,
            created_at: true,
            updated_at: true,
            stats: true,
            primary_category: { select: { id: true, name: true, slug: true, status: true } },
            categories: {
                select: {
                    category: { select: { id: true, name: true, slug: true } },
                },
            },
            tags: {
                select: {
                    tag: { select: { id: true, name: true, slug: true } },
                },
            },
        };
    }

    protected override parseSort(sortStr: string): Prisma.PostOrderByWithRelationInput[] {
        const sorts = sortStr.split(',');
        return sorts.map((s) => {
            const [field, dir] = s.split(':');
            const direction = dir ? dir.toLowerCase() : 'desc';

            // Sort theo bảng thống kê tách riêng (giống comics)
            if (field === 'view_count') {
                return {
                    stats: {
                        view_count: direction,
                    },
                } as any;
            }

            return { [field]: direction } as any;
        });
    }

    protected buildWhere(filter: PostFilter): Prisma.PostWhereInput {
        const where: Prisma.PostWhereInput = {};

        if (filter.status) where.status = filter.status as any;

        if (filter.search) {
            where.OR = [
                { name: { contains: filter.search } },
                { slug: { contains: filter.search } },
            ];
        }

        if (filter.categorySlug) {
            where.categories = {
                some: {
                    category: { slug: filter.categorySlug },
                },
            };
        }

        if (filter.tagSlug) {
            where.tags = {
                some: {
                    tag: { slug: filter.tagSlug },
                },
            };
        }

        if (filter.categoryId) {
            where.categories = {
                some: {
                    category: { id: this.toPrimaryKey(filter.categoryId) },
                },
            };
        }

        if (filter.tagId) {
            where.tags = {
                some: {
                    tag: { id: this.toPrimaryKey(filter.tagId) },
                },
            };
        }

        if (filter.isFeatured !== undefined) where.is_featured = filter.isFeatured;
        if (filter.isPinned !== undefined) where.is_pinned = filter.isPinned;

        return where;
    }

    async findPublishedBySlug(slug: string): Promise<Post | null> {
        return this.findOne({
            slug,
            status: 'published',
        });
    }

    async findBySlug(slug: string): Promise<Post | null> {
        return this.findOne({ slug });
    }

    async incrementViewCount(id: number | bigint): Promise<void> {
        try {
            if (this.redis.isEnabled()) {
                // Buffer vào Redis, cron sẽ flush vào DB (post_stats + post_daily_stats)
                await this.redis.hincrby('post:views:buffer', id.toString(), 1);
            } else {
                // Fallback: không có Redis thì ghi trực tiếp vào DB
                await this.postStatsRepository.incrementViews(id, 1);
            }
        } catch (e) {
            console.error('Failed to increment view count', e);
        }
    }

    async syncRelations(postId: number | bigint, tagIds?: number[], categoryIds?: number[]): Promise<void> {
        const id = this.toPrimaryKey(postId);

        if (tagIds !== undefined && tagIds !== null) {
            await this.prisma.postPosttag.deleteMany({ where: { post_id: id } });
            if (tagIds.length > 0) {
                await this.prisma.postPosttag.createMany({
                    data: tagIds.map((tagId) => ({ post_id: id, posttag_id: this.toPrimaryKey(tagId) })),
                    skipDuplicates: true,
                });
            }
        }

        if (categoryIds !== undefined && categoryIds !== null) {
            await this.prisma.postPostcategory.deleteMany({ where: { post_id: id } });
            if (categoryIds.length > 0) {
                await this.prisma.postPostcategory.createMany({
                    data: categoryIds.map((catId) => ({ post_id: id, postcategory_id: this.toPrimaryKey(catId) })),
                    skipDuplicates: true,
                });
            }
        }
    }
}


