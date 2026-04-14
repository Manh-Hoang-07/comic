import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { IProfileRepository } from '../../domain/profile.repository';

@Injectable()
export class ProfileRepositoryImpl implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertByUserId(userId: PrimaryKey, data: any): Promise<Profile> {
    const pk = toPrimaryKey(userId);

    return this.prisma.profile.upsert({
      where: { user_id: pk },
      create: { ...data, user_id: pk },
      update: data,
    });
  }
}
