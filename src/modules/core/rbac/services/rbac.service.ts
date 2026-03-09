import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { IUserGroupRepository, USER_GROUP_REPOSITORY } from '@/modules/core/rbac/user-group/domain/user-group.repository';
import { IUserRoleAssignmentRepository, USER_ROLE_ASSIGNMENT_REPOSITORY } from '@/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository';
import { IRoleHasPermissionRepository, ROLE_HAS_PERMISSION_REPOSITORY } from '@/modules/core/rbac/role-has-permission/domain/role-has-permission.repository';
import { IRoleContextRepository, ROLE_CONTEXT_REPOSITORY } from '@/modules/core/rbac/role-context/domain/role-context.repository';
import { IGroupRepository, GROUP_REPOSITORY } from '@/modules/core/context/group/domain/group.repository';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { IRoleRepository, ROLE_REPOSITORY } from '@/modules/core/iam/role/domain/role.repository';
import { ContextType, RbacPermission, PERM } from '@/modules/core/rbac/rbac.constants';
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
      PERM.SYSTEM.MANAGE,
      PERM.ROLE.MANAGE,
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
   * Helper lấy quyền Global (tường minh, không hack side-effect)
   */
  private async getGlobalPermissionsSet(userId: number): Promise<Set<string>> {
    let cached = await this.rbacCache.getSystemPermissions(userId);
    if (cached === null) {
      // Nạp cache system permissions nếu chưa có
      await this.ensureSystemPermissionsLoaded(userId);
      cached = await this.rbacCache.getSystemPermissions(userId);
    }
    return cached || new Set<string>();
  }

  /**
   * 🧹 [Clean Code] Nạp system permissions vào cache một cách tường minh
   */
  private async ensureSystemPermissionsLoaded(userId: number): Promise<void> {
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
      return;
    }

    const roleIds = Array.from(new Set(assignments.map((a: any) => a.role_id)));
    const permissions = await this.getPermissionsByRoleIds(roleIds);
    await this.rbacCache.setSystemPermissions(userId, permissions);
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
    // 🚀 Tối ưu: Lấy toàn bộ links Role-Permission và Permission hierarchy
    // Để xử lý triệt để đệ quy, ta có thể fetch toàn bộ Tree hoặc dùng include sâu.
    // Với Prisma, cách an toàn nhất cho Tree sâu là fetch active permissions 
    // và build Map trong memory nếu số lượng permissions nhỏ (< 1000).
    const links = await this.roleHasPermRepo.findMany({
      where: {
        role_id: { in: roleIds },
        permission: { status: 'active' as any },
      },
      include: {
        permission: true // Chỉ lấy permission trực tiếp, logic đệ quy sẽ fetch thêm nếu cần
        // Hoặc nạp sẵn 5 cấp nếu muốn tối ưu IO
      },
    });

    const set = new Set<string>();
    const permCache = new Map<bigint, any>();

    for (const link of links) {
      await this.collectPermissionCodesRecursively((link as any).permission, set, permCache);
    }
    return set;
  }

  /**
   * Đệ quy thu thập mã quyền và mã quyền cha (Flattening)
   */
  private async collectPermissionCodesRecursively(
    perm: any,
    set: Set<string>,
    permCache: Map<bigint, any>
  ): Promise<void> {
    if (!perm || perm.status !== 'active') return;

    if (perm.code) set.add(perm.code);

    // Nếu có cha, tiếp tục truy vết ngược lên
    if (perm.parent_id) {
      let parent = perm.parent;
      if (!parent) {
        // Fetch từ cache hoặc DB nếu include chưa nạp
        if (permCache.has(perm.parent_id)) {
          parent = permCache.get(perm.parent_id);
        } else {
          // Fallback fetch lẻ (nên tránh N+1 bằng cách build Tree Map trước nếu Tree to)
          parent = await this.prisma.permission.findUnique({
            where: { id: perm.parent_id }
          });
          permCache.set(perm.parent_id, parent);
        }
      }
      await this.collectPermissionCodesRecursively(parent, set, permCache);
    }
  }

  /**
   * Check system-level permissions (Global Permissions)
   * Sử dụng ensureSystemPermissionsLoaded để nạp cache nếu cần
   */
  private async checkSystemPermissions(
    userId: number,
    required: string[],
  ): Promise<boolean> {
    let cached = await this.rbacCache.getSystemPermissions(userId);
    if (cached === null) {
      await this.ensureSystemPermissionsLoaded(userId);
      cached = await this.rbacCache.getSystemPermissions(userId);
    }

    if (!cached || cached.size === 0) {
      return required.length === 0;
    }

    if (required.length === 0) return true;
    return required.some(need => cached!.has(need));
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

    // Sử dụng Transaction từ PrismaService để đảm bảo tính nguyên tử (Atomicity)
    await this.prisma.$transaction(async (tx) => {
      // 1. Xoá toàn bộ roles cũ của user trong group này
      await tx.userRoleAssignment.deleteMany({
        where: {
          user_id: BigInt(userId),
          group_id: BigInt(groupId),
        },
      });

      // 2. Thêm mới danh sách roles (Bulk Insert)
      if (roles.length > 0) {
        await tx.userRoleAssignment.createMany({
          data: roles.map(role => ({
            user_id: BigInt(userId),
            role_id: BigInt(role.id),
            group_id: BigInt(groupId),
          })),
          skipDuplicates: true,
        });
      }
    });

    // Xoá cache để lần sau nạp lại bộ quyền mới nhất
    await this.rbacCache.clearUserPermissionsInGroup(userId, groupId);
  }
}
