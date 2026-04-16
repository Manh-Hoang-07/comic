import { Injectable, BadRequestException } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { PrismaRepository } from '@/common/core/repositories';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import { IUserRepository, UserFilter } from '../../domain/user.repository';

@Injectable()
export class UserRepositoryImpl
  extends PrismaRepository<
    User,
    Prisma.UserWhereInput,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserOrderByWithRelationInput
  >
  implements IUserRepository
{
  constructor(private readonly prisma: PrismaService) {
    super(prisma.user as any);
    this.defaultSelect = {
      id: true,
      email: true,
      phone: true,
      username: true,
      name: true,
      image: true,
      status: true,
    };
    this.defaultDetailSelect = {
      id: true,
      email: true,
      phone: true,
      username: true,
      name: true,
      image: true,
      created_at: true,
      updated_at: true,
      last_login_at: true,
      status: true,
      profile: true,
    };
  }

  async findMemberGroupIds(userId: PrimaryKey): Promise<PrimaryKey[]> {
    const rows = await this.prisma.userGroup.findMany({
      where: {
        user_id: toPrimaryKey(userId),
        group: { status: 'active' },
      },
      select: { group_id: true },
      orderBy: { joined_at: 'desc' },
    });
    return rows.map((r) => r.group_id);
  }

  async findAssignments(userId: PrimaryKey, groupIds?: PrimaryKey[]) {
    const where: Prisma.UserRoleAssignmentWhereInput = {
      user_id: toPrimaryKey(userId),
    };

    if (groupIds && groupIds.length > 0) {
      where.group_id = {
        in: groupIds.map((id) => toPrimaryKey(id)),
      };
    }

    return this.prisma.userRoleAssignment.findMany({
      where,
      include: {
        role: { select: { code: true, name: true } },
        group: { select: { code: true, name: true } },
      },
    });
  }

  protected buildWhere(filter: UserFilter): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filter.search) {
      where.OR = [
        { email: { startsWith: filter.search } },
        { username: { startsWith: filter.search } },
        { phone: { startsWith: filter.search } },
      ];
    }

    if (filter.email) where.email = filter.email;
    if (filter.phone) where.phone = filter.phone;
    if (filter.username) where.username = filter.username;
    if (filter.status) where.status = filter.status as any;

    const gid = filter.groupId || (filter as any).group_id;
    if (gid) {
      where.user_groups = {
        some: {
          group_id: toPrimaryKey(gid),
        },
      };
    }

    if (filter.NOT) {
      where.NOT = filter.NOT;
    }

    return where;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      select: this.defaultSelect,
    });
    return row as User | null;
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
        password: true,
      },
    });
    return row as User | null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { phone },
      select: this.defaultSelect,
    });
    return row as User | null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { username },
      select: this.defaultSelect,
    });
    return row as User | null;
  }

  async findByIdForAuth(id: PrimaryKey): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: toPrimaryKey(id) },
      select: {
        id: true,
        password: true,
      },
    });
    return row as User | null;
  }

  async updateLastLogin(userId: PrimaryKey): Promise<void> {
    await this.update(userId, { last_login_at: new Date() });
  }

  async checkMultipleUniques(
    payload: { email?: string; phone?: string; username?: string },
    excludeId?: PrimaryKey,
  ): Promise<void> {
    const orConditions = [];
    if (payload.email) orConditions.push({ email: payload.email });
    if (payload.phone) orConditions.push({ phone: payload.phone });
    if (payload.username) orConditions.push({ username: payload.username });

    if (orConditions.length === 0) return;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: orConditions,
        NOT: excludeId ? { id: toPrimaryKey(excludeId) } : undefined,
      },
      select: { email: true, phone: true, username: true },
    });

    if (existing) {
      if (payload.email === existing.email)
        throw new BadRequestException('Email đã được sử dụng.');
      if (payload.phone === existing.phone)
        throw new BadRequestException('Số điện thoại đã được sử dụng.');
      if (payload.username === existing.username)
        throw new BadRequestException('Tên đăng nhập đã được sử dụng.');
    }
  }
}
