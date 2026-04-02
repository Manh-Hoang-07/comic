import { Injectable, BadRequestException } from '@nestjs/common';
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
  groupId?: any;
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
    };
  }

  // ── Query Operations ───────────────────────────────────────────────────────

  /**
   * Performance override: List view (findAll) and detail view (findById) 
   * only fetch basic info + profile by default.
   */
  override async findById(id: any): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: toPrimaryKey(id) },
      select: {
        ...this.defaultSelect,
      } as any,
    }) as any;
  }

  async findByIdWithBasicInfo(id: any): Promise<User | null> {
    return this.findById(id);
  }

  /**
   * Fetch explicit role and group assignments for a user.
   * This is separated for performance optimization.
   */
  async findAssignments(userId: any) {
    return this.prisma.userRoleAssignment.findMany({
      where: { user_id: toPrimaryKey(userId) },
      include: {
        role: { select: { code: true, name: true } },
        group: { select: { code: true, name: true } },
      },
    });
  }

  // ── Query Building ─────────────────────────────────────────────────────────

  protected buildWhere(filter: UserFilter): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filter.search) {
      /**
       * Performance note: 'startsWith' thường tận dụng được index (index-friendly) 
       * tốt hơn 'contains' trên các cột có index như email, username, phone.
       */
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

  // ── Authentication & Lookups ───────────────────────────────────────────────

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.findOne({ phone });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username });
  }

  async findByIdForAuth(id: any): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: toPrimaryKey(id) },
    });
  }

  async updateLastLogin(userId: any): Promise<void> {
    await this.update(userId, { last_login_at: new Date() });
  }

  // ── Validation Helpers ─────────────────────────────────────────────────────

  async checkUnique(field: 'email' | 'phone' | 'username', value: string, excludeUserId?: any): Promise<boolean> {
    const filter: Record<string, any> = { [field]: value };
    if (excludeUserId) {
      filter.NOT = { id: toPrimaryKey(excludeUserId) };
    }
    return !(await this.exists(filter));
  }

  /**
   * Performance: Kiểm tra đồng thời nhiều trường duy nhất trong một query.
   */
  async checkMultipleUniques(payload: { email?: string; phone?: string; username?: string }, excludeId?: any): Promise<void> {
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
      if (payload.email === existing.email) throw new BadRequestException('Email đã được sử dụng.');
      if (payload.phone === existing.phone) throw new BadRequestException('Số điện thoại đã được sử dụng.');
      if (payload.username === existing.username) throw new BadRequestException('Tên đăng nhập đã được sử dụng.');
    }
  }

  // ── Profile Operations ─────────────────────────────────────────────────────

  /**
   * Chuẩn hóa dữ liệu hồ sơ để phù hợp với kiểu dữ liệu của Prisma (Date, BigInt).
   */
  prepareProfileData(data: any) {
    const validFields = [
      'birthday', 'gender', 'address', 'about',
      'country_id', 'province_id', 'ward_id',
      'created_user_id', 'updated_user_id',
    ];
    
    const result: any = {};
    for (const field of validFields) {
      if (data[field] !== undefined) {
        let value = data[field];
        if (field === 'birthday' && value) {
          const date = new Date(value);
          value = isNaN(date.getTime()) ? null : date;
        } else if (['country_id', 'province_id', 'ward_id'].includes(field)) {
          value = value ? toPrimaryKey(value) : null;
        }
        result[field] = value;
      }
    }
    return result;
  }

  async upsertProfile(userId: any, data: any): Promise<Profile> {
    const pk = toPrimaryKey(userId);
    const profileData = this.prepareProfileData(data);

    return this.prisma.profile.upsert({
      where: { user_id: pk },
      create: { ...profileData, user_id: pk },
      update: profileData,
    });
  }
}
