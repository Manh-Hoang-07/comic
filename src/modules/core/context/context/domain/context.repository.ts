import { Context } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const CONTEXT_REPOSITORY = 'IContextRepository';

export interface ContextFilter {
  search?: string;
  code?: string;
  type?: string;
  refId?: any;
  status?: string;
  ids?: any[];
}

export interface IContextRepository extends IRepository<Context> {
  findByTypeAndRefId(type: string, refId: any): Promise<Context | null>;
  findByCode(code: string): Promise<Context | null>;
  findActiveByIds(ids: any[]): Promise<Context[]>;
}
