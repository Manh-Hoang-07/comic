import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ComicReview } from '@prisma/client';
import { BaseService } from '@/common/core/services';
import { IPaginationOptions } from '@/common/core/repositories';
import { IReviewRepository, REVIEW_REPOSITORY } from '../../domain/review.repository';
import { verifyGroupOwnership, getGroupFilter } from '@/common/shared/utils/group-ownership.util';
import { REVIEW_INCLUDE, normalizeReviewFilters } from '@/modules/comics/review/utils/review-query.helper';

@Injectable()
export class ReviewsService extends BaseService<ComicReview, IReviewRepository> {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    protected readonly reviewRepository: IReviewRepository,
  ) {
    super(reviewRepository);
  }

  protected override async prepareFilters(filters: any = {}): Promise<any> {
    const prepared = normalizeReviewFilters(filters);
    return { ...prepared, ...getGroupFilter() };
  }

  protected override async prepareOptions(options: IPaginationOptions): Promise<IPaginationOptions> {
    const normalized = await super.prepareOptions(options);
    (normalized as any).include = REVIEW_INCLUDE;
    return normalized;
  }

  async getStatistics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, todayCount, thisWeekCount, thisMonthCount, avgRating, ratingDistribution] = await Promise.all([
      this.repository.count({}),
      this.repository.count({ date_from: today }),
      this.repository.count({ date_from: startOfWeek }),
      this.repository.count({ date_from: startOfMonth }),
      this.reviewRepository.getAverageRating({}),
      this.reviewRepository.getRatingDistribution({}),
    ]);

    return {
      total,
      today: todayCount,
      this_week: thisWeekCount,
      this_month: thisMonthCount,
      average_rating: avgRating || 0,
      rating_distribution: ratingDistribution,
    };
  }

  override async getOne(id: string | number | bigint): Promise<ComicReview> {
    const entity = await (this.repository as any).delegate.findFirst({
      where: { id: (this.repository as any).toPrimaryKey(id) },
      include: { comic: true }
    });

    if (!entity) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (entity.comic) {
      verifyGroupOwnership(entity.comic as any);
    }

    return this.transform(entity) as ComicReview;
  }

  protected override async beforeUpdate(id: string | number | bigint, data: any): Promise<any> {
    await this.verifyOwnershipAndExistence(id);
    return data;
  }

  protected override async beforeDelete(id: string | number | bigint): Promise<boolean> {
    await this.verifyOwnershipAndExistence(id);
    return true;
  }

  private async verifyOwnershipAndExistence(id: string | number | bigint) {
    const review = await (this.repository as any).delegate.findFirst({
      where: { id: (this.repository as any).toPrimaryKey(id) },
      include: { comic: true }
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    if (review.comic) {
      verifyGroupOwnership(review.comic as any);
    }
  }

  protected override transform(entity: any): any {
    return this.deepConvertBigInt(entity);
  }
}
