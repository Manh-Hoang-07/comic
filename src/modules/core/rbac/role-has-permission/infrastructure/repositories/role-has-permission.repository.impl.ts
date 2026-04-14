import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { RoleHasPermission } from '@prisma/client';
import { IRoleHasPermissionRepository } from '../../domain/role-has-permission.repository';

@Injectable()
export class RoleHasPermissionRepositoryImpl implements IRoleHasPermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(options: {
    where?: any;
    include?: any;
  }): Promise<RoleHasPermission[]> {
    return this.prisma.roleHasPermission.findMany(options);
  }

  async findActivePermissionCodesByRoleIds(roleIds: any[]): Promise<string[]> {
    if (!roleIds.length) return [];
    const rows = await this.prisma.roleHasPermission.findMany({
      where: {
        role_id: { in: roleIds as any },
        role: { status: 'active' as any },
        permission: { status: 'active' as any },
      },
      select: {
        permission: { select: { code: true } },
      },
    });
    const out: string[] = [];
    for (const r of rows as any[]) {
      const code = r?.permission?.code;
      if (typeof code === 'string' && code.length) out.push(code);
    }
    return out;
  }
}
