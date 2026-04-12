import { User } from '@prisma/client';
import { IRepository, IPaginationOptions } from '@/common/core/repositories';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';

export const USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository extends IRepository<User> {
  findById(id: PrimaryKey, options?: IPaginationOptions): Promise<User | null>;
  /** group_id các nhóm active mà user là thành viên (user_groups), thường sort joined_at desc */
  findMemberGroupIds(userId: PrimaryKey): Promise<PrimaryKey[]>;
  findAssignments(userId: PrimaryKey, groupIds?: PrimaryKey[]): Promise<any[]>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailForAuth(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByIdForAuth(id: PrimaryKey): Promise<User | null>;
  updateLastLogin(userId: PrimaryKey): Promise<void>;
  checkMultipleUniques(
    payload: { email?: string; phone?: string; username?: string },
    excludeId?: PrimaryKey,
  ): Promise<void>;
}

export interface UserFilter {
  search?: string;
  email?: string;
  phone?: string;
  username?: string;
  status?: string;
  groupId?: PrimaryKey;
  NOT?: any;
}
