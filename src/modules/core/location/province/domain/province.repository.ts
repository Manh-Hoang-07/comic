import { IRepository } from '@/common/core/repositories/repository.interface';
import { Province } from '@prisma/client';

export type IProvinceRepository = IRepository<Province>;
