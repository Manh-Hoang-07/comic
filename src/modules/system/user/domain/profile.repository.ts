import { Profile } from '@prisma/client';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';

export const PROFILE_REPOSITORY = 'IProfileRepository';

export interface IProfileRepository {
  upsertByUserId(userId: PrimaryKey, data: any): Promise<Profile>;
}
