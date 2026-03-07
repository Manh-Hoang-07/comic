import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserGroupRepository, USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleHasPermissionRepository, ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { ContextType, RbacPermission } from '@/modules/core/rbac/rbac.constants';
import { PrismaService } from '@/core/database/prisma/prisma.service';

/**
 * Service quản lý RBAC (Role-Based Access Control)
 * Bao gồm: kiểm tra quyền/vai trò của user và quản lý roles cho user
 */
@Injectable()
export class RbacService {
  constructor(
    @Inject(USER_GROUP_REPOSITORY)
    private readonly userGroupRepo: IUserGroupRepository,
    @Inject(USER_ROLE_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepo: IUserRoleAssignmentRepository,
    @Inject(ROLE_HAS_PERMISSION_REPOSITORY)
    private readonly roleHasPermRepo: IRoleHasPermissionRepository,
    @Inject(ROLE_CONTEXT_REPOSITORY)
    private readonly roleContextRepo: IRoleContextRepository,
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    private readonly rbacCache: RbacCacheService,
    private readonly prisma: PrismaService,
  ) { }


  /**
   * Kiểm tra user có permissions trong group cụ thể
   * @param userId - ID của user
   * @param groupId - ID của group (có thể null cho system-level)
   * @param required - Mảng permissions cần check (OR logic)
   */
  async userHasPermissionsInGroup(
    userId: number,
    groupId: number | null,
    required: string[],
  ): Promise<boolean> {
    // 1. Ưu tiên check system-level permissions trước (Global Permissions)
    const hasSystemPerm = await this.checkSystemPermissions(userId, required);
    if (hasSystemPerm) return true;

    // Nếu chỉ check ở mức system (groupId = null) -> đã check xong ở trên
    if (groupId === null) return false;

    // 2. Chuyển sang check local permissions trong group
    const cached = await this.getLocalPermissionsInGroup(userId, groupId);

    // OR logic: chỉ cần 1 permission
    for (const need of required) {
      if (cached.has(need)) return true;
    }

    return false;
  }

  /**
   * [Single Source of Truth] Kiểm tra user có phải System Admin không
   */
  async isSystemAdmin(userId: number): Promise<boolean> {
    return this.userHasPermissionsInGroup(userId, null, [
      RbacPermission.SYSTEM_MANAGE,
      RbacPermission.GROUP_MANAGE,
    ]);
  }

  /**
   * Lấy tất cả permissions của User (bao gồm Global và Local trong Group)
   */
  async getUserPermissions(
    userId: number,
    groupId: number | null,
  ): Promise<Set<string>> {
    const globalPerms = await this.getGlobalPermissionsSet(userId);
    if (groupId === null) return globalPerms;

    const localPerms = await this.getLocalPermissionsInGroup(userId, groupId);
    return new Set([...globalPerms, ...localPerms]);
  }

  /**
   * Helper lấy quyền Global
   */
  private async getGlobalPermissionsSet(userId: number): Promise<Set<string>> {
    let cached = await this.rbacCache.getSystemPermissions(userId);
    if (cached === null) {
      await this.checkSystemPermissions(userId, []);
      cached = await this.rbacCache.getSystemPermissions(userId);
    }
    return cached || new Set<string>();
  }

  /**
   * Helper lấy quyền Local trong Group
   */
  private async getLocalPermissionsInGroup(userId: number, groupId: number): Promise<Set<string>> {
    let cached = await this.rbacCache.getUserPermissionsInGroup(userId, groupId);
    if (cached !== null) return cached;

    // Check user thuộc group
    const userInGroup = await this.userGroupRepo.findUnique(userId, groupId);
    if (!userInGroup) {
      const emptySet = new Set<string>();
      await this.rbacCache.setUserPermissionsInGroup(userId, groupId, emptySet);
      return emptySet;
    }

    // Query permissions từ user_role_assignments
    const assignments = await this.assignmentRepo.findManyRaw({
      where: {
        user_id: BigInt(userId),
        group_id: BigInt(groupId),
        role: { status: 'active' as any },
      },
      select: { role_id: true },
    });

    if (!assignments.length) {
      const emptySet = new Set<string>();
      await this.rbacCache.setUserPermissionsInGroup(userId, groupId, emptySet);
      return emptySet;
    }

    const roleIds = Array.from(new Set(assignments.map((a: any) => a.role_id)));
    const permissions = await this.getPermissionsByRoleIds(roleIds);

    await this.rbacCache.setUserPermissionsInGroup(userId, groupId, permissions);
    return permissions;
  }

  /**
   * Lấy danh sách permission codes (bao gồm kế thừa) từ danh sách Role IDs
   */
  private async getPermissionsByRoleIds(roleIds: bigint[]): Promise<Set<string>> {
    const links = await this.roleHasPermRepo.findMany({
      where: {
        role_id: { in: roleIds },
        permission: { status: 'active' as any },
      },
      include: {
        permission: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          },
        },
      },
    });

    const set = new Set<string>();
    for (const link of links) {
      this.collectPermissionCodes((link as any).permission, set);
    }
    return set;
  }

  /**
   * Đệ quy thu thập mã quyền từ cây hierarchy (đi ngược lên cha)
   */
  private collectPermissionCodes(perm: any, set: Set<string>): void {
    if (!perm || perm.status !== 'active') return;
    if (perm.code) set.add(perm.code);
    if (perm.parent) {
      this.collectPermissionCodes(perm.parent, set);
    }
  }

  /**
   * Check system-level permissions (Global Permissions)
   */
  private async checkSystemPermissions(
    userId: number,
    required: string[],
  ): Promise<boolean> {
    const cached = await this.rbacCache.getSystemPermissions(userId);
    if (cached !== null) {
      if (required.length === 0) return true;
      return required.some(need => cached.has(need));
    }

    const assignments = await this.assignmentRepo.findManyRaw({
      where: {
        user_id: BigInt(userId),
        group: {
          context: { type: ContextType.SYSTEM },
          status: 'active' as any,
        },
        role: { status: 'active' as any },
      },
      select: { role_id: true },
    });

    if (!assignments.length) {
      await this.rbacCache.setSystemPermissions(userId, []);
      return false;
    }

    const roleIds = Array.from(new Set(assignments.map((a: any) => a.role_id)));
    const permissions = await this.getPermissionsByRoleIds(roleIds);

    await this.rbacCache.setSystemPermissions(userId, permissions);
    if (required.length === 0) return true;
    return required.some(need => permissions.has(need));
  }

  /**
   * Gán role cho user trong group
   */
  async assignRoleToUser(
    userId: number,
    roleId: number,
    groupId: number,
  ): Promise<void> {
    const userInGroup = await this.userGroupRepo.findUnique(userId, groupId);
    if (!userInGroup) {
      throw new BadRequestException('User must be a member of the group before assigning role');
    }

    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const roleContext = await this.roleContextRepo.findFirst({
      where: {
        role_id: BigInt(roleId),
        context_id: (group as any).context_id,
      },
    });

    if (!roleContext) {
      throw new BadRequestException('Role is not allowed in this context');
    }

    const existing = await this.assignmentRepo.findUnique(userId, roleId, groupId);
    if (existing) return;

    await this.assignmentRepo.create({
      user_id: BigInt(userId),
      role_id: BigInt(roleId),
      group_id: BigInt(groupId),
    });

    await this.rbacCache.clearUserPermissionsInGroup(userId, groupId);
  }

  /**
   * Sync roles cho user trong group (Sử dụng Transaction để đảm bảo an toàn)
   */
  async syncRolesInGroup(
    userId: number,
    groupId: number,
    roleIds: number[],
    skipValidation: boolean = false,
  ): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');

    const userInGroup = await this.userGroupRepo.findUnique(userId, groupId);
    if (!userInGroup) {
      throw new BadRequestException('User must be a member of the group before assigning roles');
    }

    let roles: any[] = [];
    if (roleIds.length > 0) {
      const roleIdsBigInt = roleIds.map((id) => BigInt(id));
      roles = await this.roleRepo.findManyRaw({
        where: { id: { in: roleIdsBigInt } },
      });

      if (roles.length !== roleIds.length) {
        throw new BadRequestException('Some role IDs are invalid');
      }

      if (!skipValidation) {
        const validContexts = await this.roleContextRepo.findMany({
          where: {
            role_id: { in: roleIdsBigInt },
            context_id: (group as any).context_id,
          },
        });

        const validRoleIds = new Set(validContexts.map(rc => rc.role_id.toString()));
        for (const roleId of roleIds) {
          if (!validRoleIds.has(String(BigInt(roleId)))) {
            const role = roles.find(r => Number(r.id) === roleId);
            throw new BadRequestException(
              `Cannot assign roles that are not available in this context. Invalid role: ${role?.code}`
            );
          }
        }
      }
    }

    // Sử dụng Transaction từ PrismaService
    await this.prisma.$transaction(async (tx) => {
      await this.assignmentRepo.deleteMany({
        user_id: BigInt(userId),
        group_id: BigInt(groupId),
      });

      if (roles.length > 0) {
        await this.assignmentRepo.createMany(
          roles.map(role => ({
            user_id: BigInt(userId),
            role_id: BigInt(role.id),
            group_id: BigInt(groupId),
          }))
        );
      }
    });

    await this.rbacCache.clearUserPermissionsInGroup(userId, groupId);
  }
}
