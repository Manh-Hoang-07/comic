import { UserRoleAssignment } from '@prisma/client';
import { IRepository } from '@/common/core/repositories';

export const USER_ROLE_ASSIGNMENT_REPOSITORY = 'IUserRoleAssignmentRepository';

export interface IUserRoleAssignmentRepository extends IRepository<UserRoleAssignment> {
    findUnique(userId: any, roleId: any, groupId: any): Promise<UserRoleAssignment | null>;
    deleteMany(where: any): Promise<{ count: number }>;
    // [H3] Bulk insert thay vì sequential single inserts
    createMany(data: any[]): Promise<{ count: number }>;
}


