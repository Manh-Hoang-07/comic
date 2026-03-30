import { Injectable } from '@nestjs/common';
import { User, Prisma, Profile } from '@prisma/client';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { PrismaRepository } from '@/common/core/repositories';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

export const USER_REPOSITORY = 'IUserRepository';

export type IUserRepository = UserRepository;


export interface UserFilter {
  search?: string;
  email?: string;
  phone?: string;
  username?: string;
  status?: string;
  groupId?: number | bigint;
  NOT?: any;
}

@Injectable()
export class UserRepository extends PrismaRepository<
  User,
  Prisma.UserWhereInput,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserOrderByWithRelationInput
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.user as any);
    this.defaultSelect = {
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
      user_role_assignments: true,
    };
  }

  protected buildWhere(filter: UserFilter): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search } },
        { username: { contains: filter.search } },
        { phone: { contains: filter.search } },
      ];
    }

    if (filter.email) where.email = filter.email;
    if (filter.phone) where.phone = filter.phone;
    if (filter.username) where.username = filter.username;
    if (filter.status) where.status = filter.status as any;

    if (filter.groupId) {
      where.user_groups = {
        some: {
          group_id: toPrimaryKey(filter.groupId),
        },
      };
    }

    if (filter.NOT) {
      where.NOT = filter.NOT;
    }

    return where;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.findOne({ phone });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username });
  }

  async findByIdForAuth(id: number | bigint): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: toPrimaryKey(id),
      },
    });
  }

  async checkUnique(field: 'email' | 'phone' | 'username', value: string, excludeUserId?: number | bigint): Promise<boolean> {
    const filter: Record<string, any> = { [field]: value };
    if (excludeUserId) {
      filter.NOT = { id: toPrimaryKey(excludeUserId) };
    }
    return !(await this.exists(filter));
  }

  async upsertProfile(userId: number | bigint, data: Prisma.ProfileUncheckedCreateInput): Promise<Profile> {
    const pk = toPrimaryKey(userId);

    // Valid fields according to Prisma schema
    const validProfileFields = [
      'birthday', 'gender', 'address', 'about',
      'country_id', 'province_id', 'ward_id',
      'created_user_id', 'updated_user_id',
    ];
    
    const createData: any = { user_id: pk };
    const updateData: any = {};
    const dataAny = data as any;

    for (const field of validProfileFields) {
      if (dataAny[field] !== undefined) {
        let value = dataAny[field];
        if (field === 'birthday') {
          if (typeof value === 'string' && value.trim() !== '') {
            const date = new Date(value);
            value = isNaN(date.getTime()) ? null : date;
          } else if (!value) {
            value = null;
          }
        }
        createData[field] = value;
        updateData[field] = value;
      }
    }

    return this.prisma.profile.upsert({
      where: { user_id: pk },
      create: createData,
      update: updateData,
    });
  }

  async updateLastLogin(userId: number | bigint): Promise<void> {
    await this.update(userId, { last_login_at: new Date() });
  }

  async findByIdWithBasicInfo(userId: number | bigint) {
    return this.prisma.user.findFirst({
        where: { id: toPrimaryKey(userId) },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          email_verified_at: true,
          phone_verified_at: true,
          last_login_at: true,
          created_at: true,
          updated_at: true,
        },
    });
  }
}
