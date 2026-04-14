import { UserRoleAssignment } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const USER_ROLE_ASSIGNMENT_REPOSITORY = 'IUserRoleAssignmentRepository';

export interface IUserRoleAssignmentRepository extends IRepository<UserRoleAssignment> {
  findUnique(
    userId: any,
    roleId: any,
    groupId: any,
  ): Promise<UserRoleAssignment | null>;
  deleteMany(where: any): Promise<{ count: number }>;
  // [H3] Bulk insert thay vì sequential single inserts
  createMany(data: any[]): Promise<{ count: number }>;
  findActiveRoleIds(userId: any, groupId: any | null): Promise<any[]>;

  /**
   * One-shot permission code resolution for a user in a group/system scope.
   * This avoids 2-step queries (roleIds -> permissions) and is intended for hot-path checks.
   */
  findActivePermissionCodes(
    userId: any,
    groupId: any | null,
  ): Promise<string[]>;

  /**
   * Sync full role set for a user in a group.
   * Ensures user-group membership when roleIds is not empty.
   * Must be implemented transactionally at DB layer.
   */
  syncRolesInGroup(userId: any, groupId: any, roleIds: any[]): Promise<void>;
}
