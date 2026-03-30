import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '@/modules/core/user/repositories/user.repository';
import { ChangePasswordDto } from '../dtos/change-password.dto';

@Injectable()
export class UserPasswordService {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * Hashing helper.
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Changing password for an existing user.
   */
  async changePassword(id: number | bigint, dto: ChangePasswordDto) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    
    const hashed = await this.hash(dto.password);
    await this.userRepo.update(id, { password: hashed });
    
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }
}
