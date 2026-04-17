import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  IGroupRepository,
  GROUP_REPOSITORY,
} from '@/modules/system/group/domain/group.repository';
import {
  IContextRepository,
  CONTEXT_REPOSITORY,
} from '@/modules/system/context/domain/context.repository';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import {
  IUserGroupRepository,
  USER_GROUP_REPOSITORY,
} from '@/modules/system/rbac/user-group/domain/user-group.repository';
import {
  IUserRoleAssignmentRepository,
  USER_ROLE_ASSIGNMENT_REPOSITORY,
} from '@/modules/system/rbac/user-role-assignment/domain/user-role-assignment.repository';
import {
  IRoleRepository,
  ROLE_REPOSITORY,
} from '@/modules/system/role/domain/role.repository';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { PERM } from '@/modules/system/rbac/rbac.constants';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import { RequestContext } from '@/common/shared/utils';
import { RedisUtil } from '@/core/utils/redis.util';
import {
  invalidateUserGroupsListCache,
  userGroupsListCacheKey,
  USER_GROUPS_LIST_TTL_SEC,
} from '@/modules/system/group/user/user-groups-list.cache';

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
    private readonly redis: RedisUtil,
  ) {}

  async isOwner(groupId: any, userId: any): Promise<boolean> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) return false;
    return group.owner_id != null && String(group.owner_id) === String(userId);
  }

  /**
   * Kiểm tra quyền quản lý Group
   */
  async canManageGroup(groupId: any, userId: any): Promise<boolean> {
    const group = await this.groupRepo.findById(groupId);
    if (!group) return false;

    if (group.owner_id != null && String(group.owner_id) === String(userId))
      return true;

    // Check system context
    const context = RequestContext.get<any>('context');
    if (context?.type === 'system') return true;

    return this.rbacService.hasPermissions(userId, groupId, [
      PERM.ROLE.MANAGE, // Thay thế cho các quyền group.manage/add không có trong DB
    ]);
  }

  async addMember(
    groupId: any,
    memberUserId: any,
    roleIds: any[],
    requesterUserId: any,
  ): Promise<void> {
    const canManage = await this.canManageGroup(groupId, requesterUserId);
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to add members to this group',
      );
    }

    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const member = await this.userRepo.findById(memberUserId);
    if (!member) throw new NotFoundException('Member user not found');

    const existingUserGroup = await this.userGroupRepo.findUnique(
      memberUserId,
      groupId,
    );

    if (!existingUserGroup) {
      await this.userGroupRepo.create({
        user_id: toPrimaryKey(memberUserId),
        group_id: toPrimaryKey(groupId),
        joined_at: new Date(),
      } as any);
    }

    // Sync roles inside group
    await this.rbacService.syncRolesInGroup(memberUserId, groupId, roleIds);
    await invalidateUserGroupsListCache(this.redis, memberUserId);
  }

  /**
   * Thay thế toàn bộ roles của member trong group
   */
  async assignRolesToMember(
    groupId: any,
    memberUserId: any,
    roleIds: any[],
    requesterUserId: any,
  ): Promise<void> {
    const canManage = await this.canManageGroup(groupId, requesterUserId);
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to manage roles in this group',
      );
    }

    const existingUserGroup = await this.userGroupRepo.findUnique(
      memberUserId,
      groupId,
    );
    if (!existingUserGroup) {
      throw new BadRequestException(
        'User must be a member of the group before assigning roles',
      );
    }

    await this.rbacService.syncRolesInGroup(memberUserId, groupId, roleIds);
    await invalidateUserGroupsListCache(this.redis, memberUserId);
  }

  async removeMember(
    groupId: any,
    memberUserId: any,
    requesterUserId: any,
  ): Promise<void> {
    const canManage = await this.canManageGroup(groupId, requesterUserId);
    if (!canManage) {
      throw new ForbiddenException(
        'You do not have permission to remove members from this group',
      );
    }

    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    if (
      group.owner_id != null &&
      String(group.owner_id) === String(memberUserId)
    ) {
      throw new BadRequestException('Cannot remove owner from group');
    }

    await this.userGroupRepo.deleteMany({
      user_id: toPrimaryKey(memberUserId),
      group_id: toPrimaryKey(groupId),
    });

    await this.assignmentRepo.deleteMany({
      user_id: toPrimaryKey(memberUserId),
      group_id: toPrimaryKey(groupId),
    });

    await this.rbacCache.clearUserCache(memberUserId, groupId);
    await invalidateUserGroupsListCache(this.redis, memberUserId);
  }

  /**
   * Lấy danh sách thành viên của group
   */
  async getGroupMembers(groupId: any) {
    const assignments = await this.assignmentRepo.findManyRaw({
      where: {
        group_id: toPrimaryKey(groupId),
      },
      include: {
        user: true,
        role: true,
      },
    });

    // Gom nhóm assignments theo user_id để tránh trả về duplicate user (vì 1 user có N roles)
    const userMap = new Map<string, any>();
    for (const a of assignments as any[]) {
      const userId = a.user_id;
      const userIdStr = String(userId);
      if (!userMap.has(userIdStr)) {
        userMap.set(userIdStr, {
          user_id: userId,
          user: a.user
            ? {
                id: toPrimaryKey(a.user.id),
                username: a.user.username,
                email: a.user.email,
              }
            : null,
          roles: [],
        });
      }
      if (a.role) {
        userMap.get(userIdStr).roles.push({
          id: toPrimaryKey(a.role.id),
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
  async getUserGroups(userId: any) {
    if (this.redis.isEnabled()) {
      const hit = await this.redis.get(userGroupsListCacheKey(userId));
      if (hit) {
        try {
          const parsed = JSON.parse(hit) as any[];
          return parsed;
        } catch {
          /* load DB */
        }
      }
    }
    const userGroups = await this.userGroupRepo.findManyRaw({
      where: { user_id: toPrimaryKey(userId) },
      select: {
        joined_at: true,
        group: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            description: true,
            status: true,
            context: {
              select: {
                id: true,
                type: true,
                ref_id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { joined_at: 'desc' } as any,
    });

    const groupIds = (userGroups as any[])
      .map((ug) => ug?.group?.id)
      .filter((id) => id !== null && id !== undefined);

    const assignments = groupIds.length
      ? await this.assignmentRepo.findManyRaw({
          where: {
            user_id: toPrimaryKey(userId),
            group_id: { in: groupIds.map((id: any) => toPrimaryKey(id)) },
          },
          select: {
            group_id: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        })
      : [];
    const rolesByGroup = new Map<string, any[]>();
    for (const a of assignments as any[]) {
      const gid = a.group_id;
      const k = String(gid);
      if (!rolesByGroup.has(k)) rolesByGroup.set(k, []);
      if (a.role) {
        rolesByGroup.get(k)!.push({
          id: toPrimaryKey(a.role.id),
          code: a.role.code,
          name: a.role.name,
        });
      }
    }

    const result = userGroups
      .map((ug: any) => {
        const group = ug.group;
        if (!group || group.status !== 'active') return null;
        const gidKey = String(group.id);

        return {
          id: toPrimaryKey(group.id),
          code: group.code,
          name: group.name,
          type: group.type,
          description: group.description,
          context: group.context
            ? {
                id: group.context.id.toString(),
                type: group.context.type,
                ref_id: group.context.ref_id
                  ? group.context.ref_id.toString()
                  : null,
                name: group.context.name,
              }
            : null,
          roles: rolesByGroup.get(gidKey) || [],
          joined_at: ug.joined_at,
        };
      })
      .filter((item) => item !== null);
    if (this.redis.isEnabled()) {
      await this.redis.set(
        userGroupsListCacheKey(userId),
        JSON.stringify(result),
        USER_GROUPS_LIST_TTL_SEC,
      );
    }
    return result;
  }
}
