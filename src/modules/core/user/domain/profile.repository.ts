import { Profile } from '@prisma/client';

export const PROFILE_REPOSITORY = 'IProfileRepository';

export interface IProfileRepository {
  upsertByUserId(userId: any, data: any): Promise<Profile>;
}
