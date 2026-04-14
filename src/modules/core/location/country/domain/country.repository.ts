import { IRepository } from '@/common/core/repositories/repository.interface';
import { Country } from '@prisma/client';

export type ICountryRepository = IRepository<Country>;
