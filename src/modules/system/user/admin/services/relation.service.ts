import { Injectable, Inject } from '@nestjs/common';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from '@/modules/system/user/domain/profile.repository';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class RelationService {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepo: IProfileRepository,
  ) {}

  // ── Relation Synchronization ───────────────────────────────────────────────

  async sync(userId: PrimaryKey, data: { profile?: any }): Promise<void> {
    if (data.profile) {
      await this.profileRepo.upsertByUserId(
        userId,
        this.normalizeProfileData(data.profile),
      );
    }
  }

  private normalizeProfileData(data: any) {
    const validFields = [
      'birthday',
      'gender',
      'address',
      'about',
      'country_id',
      'province_id',
      'ward_id',
      'created_user_id',
      'updated_user_id',
    ];

    const result: any = {};
    for (const field of validFields) {
      if (data[field] !== undefined) {
        let value = data[field];
        if (field === 'birthday' && value) {
          const date = new Date(value);
          value = isNaN(date.getTime()) ? null : date;
        } else if (
          [
            'country_id',
            'province_id',
            'ward_id',
            'created_user_id',
            'updated_user_id',
          ].includes(field)
        ) {
          value = value ? toPrimaryKey(value) : null;
        }
        result[field] = value;
      }
    }
    return result;
  }
}
