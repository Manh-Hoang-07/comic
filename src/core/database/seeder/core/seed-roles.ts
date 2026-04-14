import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedRoles {
  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    const baseDir = path.join(
      process.cwd(),
      'src',
      'core',
      'database',
      'json',
      'core',
    );
    const rolesData: any[] = JSON.parse(
      fs.readFileSync(path.join(baseDir, 'roles.json'), 'utf8'),
    );

    const adminUser = await this.prisma.user.findFirst({
      where: { username: 'systemadmin' },
    });
    const defaultUserId = adminUser ? adminUser.id : BigInt(1);

    const createdRoles: Map<string, any> = new Map();

    for (const roleData of rolesData) {
      const role = await this.prisma.role.upsert({
        where: { code: roleData.code },
        update: {
          name: roleData.name,
          status: roleData.status,
          updated_user_id: defaultUserId,
        },
        create: {
          ...roleData,
          created_user_id: defaultUserId,
          updated_user_id: defaultUserId,
        },
      });
      createdRoles.set(role.code, role);
    }

    await this.assignPermissionsToRoles(createdRoles);
    await this.assignRolesToContexts(createdRoles);
  }

  private async assignPermissionsToRoles(
    createdRoles: Map<string, any>,
  ): Promise<void> {
    const allPermissions = await this.prisma.permission.findMany({
      where: { status: 'active' },
    });

    const roleConfigs = [
      {
        code: 'super_admin',
        filter: () => true, // All permissions
      },
      {
        code: 'group_owner',
        filter: (p: any) =>
          p.code.startsWith('comic.') ||
          p.code.startsWith('chapter.') ||
          p.code.startsWith('user.') ||
          p.code.startsWith('profile.'),
      },
      {
        code: 'group_editor',
        filter: (p: any) =>
          [
            'comic.create',
            'comic.update',
            'comic.view',
            'chapter.create',
            'chapter.view',
            'profile.view',
          ].includes(p.code),
      },
      {
        code: 'group_uploader',
        filter: (p: any) =>
          [
            'chapter.create',
            'chapter.update',
            'chapter.view',
            'profile.view',
          ].includes(p.code),
      },
    ];

    for (const config of roleConfigs) {
      const role = createdRoles.get(config.code);
      if (role) {
        const perms = allPermissions.filter(config.filter);
        await this.prisma.roleHasPermission.deleteMany({
          where: { role_id: role.id },
        });
        await this.prisma.roleHasPermission.createMany({
          data: perms.map((perm) => ({
            role_id: role.id,
            permission_id: perm.id,
          })),
        });
      }
    }
  }

  private async assignRolesToContexts(
    createdRoles: Map<string, any>,
  ): Promise<void> {
    const systemContext = await this.prisma.context.findFirst({
      where: { code: 'system' },
    });
    const groupContext = await this.prisma.context.findFirst({
      where: { code: 'group' },
    });

    if (!systemContext || !groupContext) return;

    const mappings = [
      { roleCode: 'super_admin', context: systemContext },
      { roleCode: 'group_owner', context: groupContext },
      { roleCode: 'group_editor', context: groupContext },
      { roleCode: 'group_uploader', context: groupContext },
    ];

    for (const map of mappings) {
      const role = createdRoles.get(map.roleCode);
      if (role && map.context) {
        await this.prisma.roleContext.deleteMany({
          where: { role_id: role.id },
        });

        await this.prisma.roleContext.upsert({
          where: {
            role_id_context_id: {
              role_id: role.id,
              context_id: map.context.id,
            },
          },
          update: {},
          create: {
            role_id: role.id,
            context_id: map.context.id,
          },
        });
      }
    }
  }

  async clear(): Promise<void> {
    await this.prisma.roleHasPermission.deleteMany({});
    await this.prisma.roleContext.deleteMany({});
    await this.prisma.role.deleteMany({});
  }
}
