import { Injectable } from '@nestjs/common';
import { UserRoleAssignment, Prisma } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { PrismaRepository } from '@/common/core/repositories';
import { IUserRoleAssignmentRepository } from '../../domain/user-role-assignment.repository';

@Injectable()
export class UserRoleAssignmentRepositoryImpl
  extends PrismaRepository<
    UserRoleAssignment,
    Prisma.UserRoleAssignmentWhereInput,
    Prisma.UserRoleAssignmentCreateInput,
    Prisma.UserRoleAssignmentUpdateInput,
    Prisma.UserRoleAssignmentOrderByWithRelationInput
  >
  implements IUserRoleAssignmentRepository
{
  constructor(private readonly prisma: PrismaService) {
    super(prisma.userRoleAssignment as unknown as any);
  }

  async findUnique(
    userId: any,
    roleId: any,
    groupId: any,
  ): Promise<UserRoleAssignment | null> {
    return this.prisma.userRoleAssignment.findUnique({
      where: {
        user_id_role_id_group_id: {
          user_id: this.toPrimaryKey(userId),
          role_id: this.toPrimaryKey(roleId),
          group_id: this.toPrimaryKey(groupId),
        },
      },
    });
  }

  // [H3] Bulk insert để tránh N round-trips đến DB khi sync nhiều roles
  async createMany(data: any[]): Promise<{ count: number }> {
    return this.prisma.userRoleAssignment.createMany({
      data,
      skipDuplicates: true, // Tự bỏ qua nếu đã tồn tại
    });
  }

  async findActiveRoleIds(userId: any, groupId: any | null): Promise<any[]> {
    const rows = await this.prisma.userRoleAssignment.findMany({
      where: {
        user_id: this.toPrimaryKey(userId),
        role: { status: 'active' },
        ...(groupId === null
          ? { group: { code: 'system' } }
          : { group_id: this.toPrimaryKey(groupId) }),
      },
      select: { role_id: true },
    });
    return rows.map((r) => r.role_id);
  }

  async findActivePermissionCodes(
    userId: any,
    groupId: any | null,
  ): Promise<string[]> {
    const rows = await this.prisma.roleHasPermission.findMany({
      where: {
        role: {
          status: 'active' as any,
          user_role_assignments: {
            some: {
              user_id: this.toPrimaryKey(userId),
              ...(groupId === null
                ? { group: { code: 'system' as any } }
                : { group_id: this.toPrimaryKey(groupId) }),
            },
          },
        },
        permission: { status: 'active' as any },
      },
      select: { permission: { select: { code: true } } },
    });

    // de-dup in application layer (Prisma distinct across relation select is awkward across DBs)
    const out = new Set<string>();
    for (const r of rows as any[]) {
      const code = r?.permission?.code;
      if (typeof code === 'string' && code.length) out.add(code);
    }
    return Array.from(out);
  }

  async syncRolesInGroup(
    userId: any,
    groupId: any,
    roleIds: any[],
  ): Promise<void> {
    const userIdPk = this.toPrimaryKey(userId);
    const groupIdPk = this.toPrimaryKey(groupId);
    const roleIdsPk = roleIds.map((id) => this.toPrimaryKey(id));

    await this.prisma.$transaction(async (tx) => {
      if (roleIdsPk.length > 0) {
        await tx.userGroup.upsert({
          where: {
            user_id_group_id: { user_id: userIdPk, group_id: groupIdPk },
          },
          create: {
            user_id: userIdPk,
            group_id: groupIdPk,
            joined_at: new Date(),
          },
          update: {},
        });
      }

      await tx.userRoleAssignment.deleteMany({
        where: { user_id: userIdPk, group_id: groupIdPk },
      });

      if (roleIdsPk.length > 0) {
        await tx.userRoleAssignment.createMany({
          data: roleIdsPk.map((rid) => ({
            user_id: userIdPk,
            group_id: groupIdPk,
            role_id: rid,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  protected buildWhere(filter: any): Prisma.UserRoleAssignmentWhereInput {
    const where: Prisma.UserRoleAssignmentWhereInput = {};
    if (filter.user_id) where.user_id = this.toPrimaryKey(filter.user_id);
    if (filter.role_id) where.role_id = this.toPrimaryKey(filter.role_id);
    if (filter.group_id) where.group_id = this.toPrimaryKey(filter.group_id);
    return where;
  }
}
