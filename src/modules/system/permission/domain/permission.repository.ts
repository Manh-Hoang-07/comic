import { Permission } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const PERMISSION_REPOSITORY = 'IPermissionRepository';

export interface PermissionFilter {
  search?: string;
  code?: string;
  status?: string;
  parentId?: any;
  scope?: string;
}

export interface IPermissionRepository extends IRepository<Permission> {
  findByCode(code: string): Promise<Permission | null>;
  /** Lightweight fetch for RBAC indexing (no relations). */
  findActiveForRbacIndex(): Promise<
    Pick<Permission, 'id' | 'code' | 'parent_id'>[]
  >;
}
