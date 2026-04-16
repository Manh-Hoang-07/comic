import { Role } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const ROLE_REPOSITORY = 'IRoleRepository';

export interface RoleFilter {
  search?: string;
  code?: string;
  status?: string;
  parentId?: any;
}

export interface IRoleRepository extends IRepository<Role> {
  findByCode(code: string): Promise<Role | null>;
  syncPermissions(roleId: any, permissionIds: any[]): Promise<void>;
  syncContexts(roleId: any, contextIds: any[]): Promise<void>;
}
