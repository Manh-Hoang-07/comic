import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '@/modules/core/user/repositories/user.repository';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepo: UserRepository) {}

  async getProfile(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const userFields = ['name', 'image'];
    const profileFields = ['birthday', 'gender', 'address', 'about', 'country_id', 'province_id', 'ward_id'];

    const userPayload: any = {};
    const profileData: any = {};
    const dtoAny = dto as any;

    Object.keys(dto).forEach(key => {
      if (userFields.includes(key)) {
          userPayload[key] = dtoAny[key];
      } else if (profileFields.includes(key)) {
          profileData[key] = dtoAny[key];
      }
    });

    if (Object.keys(profileData).length > 0) {
      userPayload.profile = { 
          upsert: {
              create: profileData,
              update: profileData
          }
      };
    }

    return this.userRepo.update(userId, userPayload);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findByIdForAuth(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (user.password) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { password: hashed });
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }
}
