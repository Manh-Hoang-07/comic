import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/modules/core/user/repositories/user.repository';

@Injectable()
export class RelationService {
  constructor(
    private readonly userRepo: UserRepository,
  ) { }

  // ── Relation Synchronization ───────────────────────────────────────────────

  async sync(userId: any, data: { profile?: any }): Promise<void> {
    if (data.profile) {
      await this.userRepo.upsertProfile(userId, data.profile);
    }
  }
}


