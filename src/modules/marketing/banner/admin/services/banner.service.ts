import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import {
  IBannerRepository,
  BANNER_REPOSITORY,
} from '@/modules/marketing/banner/domain/banner.repository';
import {
  IBannerLocationRepository,
  BANNER_LOCATION_REPOSITORY,
} from '@/modules/marketing/banner-location/domain/banner-location.repository';
import { BaseContentService } from '@/common/core/services';
import { Banner } from '@prisma/client';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class BannerService extends BaseContentService<
  Banner,
  IBannerRepository
> {
  constructor(
    @Inject(BANNER_REPOSITORY)
    private readonly bannerRepo: IBannerRepository,
    @Inject(BANNER_LOCATION_REPOSITORY)
    private readonly locationRepo: IBannerLocationRepository,
  ) {
    super(bannerRepo);
  }

  protected defaultSort = 'sort_order:asc,created_at:desc';

  async getSimpleList(query: any) {
    return this.getList({
      ...query,
      limit: query.limit ?? 50,
    });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    if (data.location_id) {
      await this.validateLocation(data.location_id);
      data.location_id = toPrimaryKey(data.location_id);
    }
    return data;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const current = await this.getOne(id);

    if (
      data.location_id &&
      toPrimaryKey(data.location_id) !==
        toPrimaryKey((current as any).location_id)
    ) {
      await this.validateLocation(data.location_id);
      data.location_id = toPrimaryKey(data.location_id);
    }
    return data;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async validateLocation(locationId: any) {
    const location = await this.locationRepo.findById(locationId);
    if (!location) {
      throw new NotFoundException(
        `Vị trí banner với ID ${locationId} không tồn tại`,
      );
    }
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(banner: any) {
    if (!banner) return banner;
    const item = super.transform(banner) as any;
    if (item.banner_location) {
      item.location = {
        id: toPrimaryKey(item.banner_location.id),
        name: item.banner_location.name,
        code: item.banner_location.code,
      };
      delete item.banner_location;
    }
    return item;
  }
}
