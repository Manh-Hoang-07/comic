import { Injectable, ConflictException, Inject } from '@nestjs/common';
import {
  IBannerLocationRepository,
  BANNER_LOCATION_REPOSITORY,
} from '@/modules/marketing/banner-location/domain/banner-location.repository';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';
import { BaseService } from '@/common/core/services';
import { BannerLocation } from '@prisma/client';

@Injectable()
export class BannerLocationService extends BaseService<
  BannerLocation,
  IBannerLocationRepository
> {
  constructor(
    @Inject(BANNER_LOCATION_REPOSITORY)
    private readonly locationRepo: IBannerLocationRepository,
  ) {
    super(locationRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({
      ...query,
      limit: query.limit ?? 50,
    });
  }

  // ── Extended Operations ────────────────────────────────────────────────────

  async changeStatus(id: any, status: BasicStatus) {
    return this.update(id, { status: status as any });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    if (data.code && (await this.locationRepo.findByCode(data.code))) {
      throw new ConflictException(`Mã vị trí banner "${data.code}" đã tồn tại`);
    }
    return data;
  }

  protected override async beforeUpdate(id: any, data: any) {
    const current = await this.getOne(id); // Includes existence check

    if (data.code && data.code !== (current as any).code) {
      if (await this.locationRepo.findByCode(data.code)) {
        throw new ConflictException(
          `Mã vị trí banner "${data.code}" đã tồn tại`,
        );
      }
    }
    return data;
  }
}
