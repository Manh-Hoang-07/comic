import { Injectable } from '@nestjs/common';
import { Role, Prisma } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { PrismaRepository } from '@/common/core/repositories';
import { IRoleRepository, RoleFilter } from '../../domain/role.repository';

@Injectable()
export class RoleRepositoryImpl
  extends PrismaRepository<
    Role,
    Prisma.RoleWhereInput,
    Prisma.RoleCreateInput,
    Prisma.RoleUpdateInput,
    Prisma.RoleOrderByWithRelationInput
  >
  implements IRoleRepository
{
  constructor(private readonly prisma: PrismaService) {
    super(prisma.role as unknown as any);

    this.defaultSelect = {
      id: true,
      code: true,
      name: true,
      status: true,
      parent_id: true,
      created_at: true,
      updated_at: true,
    };

    this.defaultDetailSelect = {
      ...this.defaultSelect,
      parent: { select: { id: true, name: true, code: true, status: true } },
      children: { select: { id: true, name: true, code: true, status: true } },
      permissions: { include: { permission: true } },
      role_contexts: { include: { context: true } },
    };
  }

  protected buildWhere(
    filter: RoleFilter & { contextId?: any },
  ): Prisma.RoleWhereInput {
    const where: Prisma.RoleWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { code: { contains: filter.search } },
      ];
    }

    if (filter.code) {
      where.code = filter.code;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.parentId !== undefined) {
      where.parent_id =
        filter.parentId === null ? null : this.toPrimaryKey(filter.parentId);
    }

    if (filter.contextId) {
      where.role_contexts = {
        some: { context_id: this.toPrimaryKey(filter.contextId) },
      };
    }

    return where;
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.findOne({ code });
  }

  async syncPermissions(roleId: any, permissionIds: any[]): Promise<void> {
    await this.prisma.roleHasPermission.deleteMany({
      where: { role_id: this.toPrimaryKey(roleId) },
    });

    if (permissionIds.length > 0) {
      await this.prisma.roleHasPermission.createMany({
        data: permissionIds.map((pid) => ({
          role_id: this.toPrimaryKey(roleId),
          permission_id: this.toPrimaryKey(pid),
        })),
        skipDuplicates: true,
      });
    }
  }

  async syncContexts(roleId: any, contextIds: any[]): Promise<void> {
    await this.prisma.roleContext.deleteMany({
      where: { role_id: this.toPrimaryKey(roleId) },
    });

    if (contextIds.length > 0) {
      await this.prisma.roleContext.createMany({
        data: contextIds.map((cid) => ({
          role_id: this.toPrimaryKey(roleId),
          context_id: this.toPrimaryKey(cid),
        })),
        skipDuplicates: true,
      });
    }
  }
}
