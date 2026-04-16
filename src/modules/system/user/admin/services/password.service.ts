import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/modules/system/user/domain/user.repository';
import { ChangePasswordDto } from '../dtos/change-password.dto';

@Injectable()
export class PasswordService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  // ── Password Operations ────────────────────────────────────────────────────

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async changePassword(id: PrimaryKey, dto: ChangePasswordDto) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const hashed = await this.hash(dto.password);
    await this.userRepo.update(id, { password: hashed });

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }
}
