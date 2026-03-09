import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { IContextRepository, CONTEXT_REPOSITORY } from '@/modules/core/context/context/domain/context.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserGroupRepository, USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { RbacPermission, PERM } from '@/modules/core/rbac/rbac.constants';

@Injectable()
export class UserGroupService {
  constructor(
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
    @Inject(CONTEXT_REPOSITORY)
    private readonly contextRepo: IContextRepository,
    @Inject(USER_GROUP_REPOSITORY)
    private readonly userGroupRepo: IUserGroupRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IUserRoleAssignmentRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly rbacService: RbacService,
    private readonly rbacCache: RbacCacheService,
  ) { }

  async isOwner(groupId: number, userId: number): Promise<boolean> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) return false;
    return group.owner_id != null && Number(group.owner_id) === userId;
  }

  /**
   * Kiểm tra quyền quản lý Group
   */
  async canManageGroup(groupId: number, userId: number): Promise<boolean> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) return false;

    if (group.owner_id != null && Number(group.owner_id) === userId) return true;

    // Check system admin via centralized RbacService logic
    const isSystemAdmin = await this.rbacService.isSystemAdmin(userId);
    if (isSystemAdmin) return true;

    return this.rbacService.userHasPermissionsInGroup(userId, groupId, [
      PERM.ROLE.MANAGE, // Thay thế cho các quyền group.manage/add không có trong DB
    ]);
  }

  async addMember(
    groupId: number,
    memberUserId: number,
    roleIds: number[],
    requesterUserId: number,
  ): Promise<void> {
    const canManage = await this.canManageGroup(groupId, requesterUserId);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to add members to this group');
    }

    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const member = await this.userRepo.findById(memberUserId);
    if (!member) throw new NotFoundException('Member user not found');

    const existingUserGroup = await this.userGroupRepo.findUnique(memberUserId, groupId);

    if (!existingUserGroup) {
      await this.userGroupRepo.create({
        user_id: BigInt(memberUserId),
        group_id: BigInt(groupId),
        joined_at: new Date(),
      } as any);
    }

    // Sync roles inside group
    await this.rbacService.syncRolesInGroup(memberUserId, groupId, roleIds);
  }

  /**
   * Thay thế toàn bộ roles của member trong group
   */
  async assignRolesToMember(
    groupId: number,
    memberUserId: number,
    roleIds: number[],
    requesterUserId: number,
  ): Promise<void> {
    const canManage = await this.canManageGroup(groupId, requesterUserId);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to manage roles in this group');
    }

    const existingUserGroup = await this.userGroupRepo.findUnique(memberUserId, groupId);
    if (!existingUserGroup) {
      throw new BadRequestException('User must be a member of the group before assigning roles');
    }

    await this.rbacService.syncRolesInGroup(memberUserId, groupId, roleIds);
  }

  async removeMember(
    groupId: number,
    memberUserId: number,
    requesterUserId: number,
  ): Promise<void> {
    const canManage = await this.canManageGroup(groupId, requesterUserId);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to remove members from this group');
    }

    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (group.owner_id != null && Number(group.owner_id) === memberUserId) {
      throw new BadRequestException('Cannot remove owner from group');
    }

    await this.userGroupRepo.deleteMany({
      user_id: BigInt(memberUserId),
      group_id: BigInt(groupId),
    });

    await this.assignmentRepo.deleteMany({
      user_id: BigInt(memberUserId),
      group_id: BigInt(groupId),
    });

    await this.rbacCache.clearUserPermissionsInGroup(memberUserId, groupId);
  }

  /**
   * Lấy danh sách thành viên của group
   */
  async getGroupMembers(groupId: number) {
    const assignments = await this.assignmentRepo.findManyRaw({
      where: {
        group_id: BigInt(groupId),
      },
      include: {
        user: true,
        role: true,
      },
    });

    // Gom nhóm assignments theo user_id để tránh trả về duplicate user (vì 1 user có N roles)
    const userMap = new Map<number, any>();
    for (const a of (assignments as any[])) {
      const userId = Number(a.user_id);
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          user: a.user ? {
            id: Number(a.user.id),
            username: a.user.username,
            email: a.user.email,
          } : null,
          roles: []
        });
      }
      if (a.role) {
        userMap.get(userId).roles.push({
          id: Number(a.role.id),
          code: a.role.code,
          name: a.role.name,
        });
      }
    }

    return Array.from(userMap.values());
  }

  /**
   * [🚀 Tối ưu - Fix N+1] Lấy danh sách nhóm của User
   */
  async getUserGroups(userId: number) {
    // 1. Fetch UserGroup kèm Group và assignments trong duy nhất 1 query prisma
    const userGroups = await this.userGroupRepo.findManyRaw({
      where: { user_id: BigInt(userId) },
      include: {
        group: {
          include: {
            context: true,
            user_role_assignments: {
              where: { user_id: BigInt(userId) },
              include: { role: true }
            }
          }
        },
      },
      orderBy: { joined_at: 'desc' } as any,
    });

    return userGroups.map((ug: any) => {
      const group = ug.group;
      if (!group || group.status !== 'active') return null;

      return {
        id: Number(group.id),
        code: group.code,
        name: group.name,
        type: group.type,
        description: group.description,
        context: group.context
          ? {
            id: group.context.id.toString(),
            type: group.context.type,
            ref_id: group.context.ref_id ? group.context.ref_id.toString() : null,
            name: group.context.name,
          }
          : null,
        roles: (group.user_role_assignments || [])
          .filter((ra: any) => ra.role)
          .map((ra: any) => ({
            id: Number(ra.role.id),
            code: ra.role.code,
            name: ra.role.name,
          })),
        joined_at: ug.joined_at,
      };
    }).filter(item => item !== null);
  }
}
