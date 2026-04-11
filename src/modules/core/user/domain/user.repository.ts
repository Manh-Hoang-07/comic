import { User } from '@prisma/client';
import { IRepository, IPaginationOptions } from '@/common/core/repositories';

export const USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository extends IRepository<User> {
  findById(id: any, options?: IPaginationOptions): Promise<User | null>;
  /** group_id các nhóm active mà user là thành viên (user_groups), thường sort joined_at desc */
  findMemberGroupIds(userId: any): Promise<any[]>;
  findAssignments(userId: any, groupIds?: any[]): Promise<any[]>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailForAuth(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByIdForAuth(id: any): Promise<User | null>;
  updateLastLogin(userId: any): Promise<void>;
  checkMultipleUniques(payload: { email?: string; phone?: string; username?: string }, excludeId?: any): Promise<void>;
}

export interface UserFilter {
  search?: string;
  email?: string;
  phone?: string;
  username?: string;
  status?: string;
  groupId?: any;
  NOT?: any;
}
