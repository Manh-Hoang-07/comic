import { IRepository } from '@/common/core/repositories/repository.interface';
import { Ward } from '@prisma/client';

export type IWardRepository = IRepository<Ward>;
