import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedGroups {
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
    const { contexts, groups } = JSON.parse(
      fs.readFileSync(path.join(baseDir, 'groups.json'), 'utf8'),
    );

    const adminUser = await this.prisma.user.findFirst({
      where: { username: 'systemadmin' },
    });
    const defaultOwnerId = adminUser ? adminUser.id : BigInt(1);

    const contextMap = new Map<string, any>();
    for (const data of contexts) {
      let ctx = await this.prisma.context.findFirst({
        where: { code: data.code },
      });
      if (!ctx) ctx = await this.prisma.context.create({ data });
      contextMap.set(ctx.code, ctx);
    }

    const groupMap = new Map<string, any>();
    for (const data of groups) {
      const context = contextMap.get(data.context_code);
      if (!context) continue;

      const { context_code: _context_code, ...groupData } = data;

      let group = await this.prisma.group.findFirst({
        where: { code: data.code },
      });
      if (!group) {
        group = await this.prisma.group.create({
          data: {
            ...groupData,
            context_id: context.id,
            owner_id: defaultOwnerId,
          },
        });
      } else if (
        group.owner_id !== defaultOwnerId ||
        group.context_id !== context.id
      ) {
        group = await this.prisma.group.update({
          where: { id: group.id },
          data: { owner_id: defaultOwnerId, context_id: context.id },
        });
      }
      groupMap.set(group.code, group);
    }

    const groupContext = contextMap.get('group');
    const groupDemo = groupMap.get('group_demo');
    if (groupContext && groupDemo && groupContext.ref_id !== groupDemo.id) {
      await this.prisma.context.update({
        where: { id: groupContext.id },
        data: { ref_id: groupDemo.id },
      });
    }
  }

  async clear(): Promise<void> {
    await this.prisma.context.deleteMany({
      where: { type: { not: 'system' } },
    });
    await this.prisma.group.deleteMany({});
  }
}
