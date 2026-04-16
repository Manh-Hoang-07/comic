import { RoleHasPermission } from '@prisma/client';

export const ROLE_HAS_PERMISSION_REPOSITORY = 'IRoleHasPermissionRepository';

export interface IRoleHasPermissionRepository {
  findMany(options: {
    where?: any;
    include?: any;
  }): Promise<RoleHasPermission[]>;

  /** Fetch active permission codes for the provided role IDs (lightweight, no full relation payload). */
  findActivePermissionCodesByRoleIds(roleIds: any[]): Promise<string[]>;
}
