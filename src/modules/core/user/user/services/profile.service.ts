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
  constructor(private readonly userRepo: UserRepository) { }

  // ── Profile Operations ─────────────────────────────────────────────────────

  /**
   * @param jwtUser `req.user` sau JWT validate — nếu đã có đủ `profile` (cache/DB trong JwtStrategy) thì không query lại.
   */
  async getProfile(userId: any, jwtUser?: any) {
    if (
      jwtUser &&
      typeof jwtUser === 'object' &&
      'profile' in jwtUser &&
      String((jwtUser as any).id) === String(userId)
    ) {
      return jwtUser;
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async updateProfile(userId: any, dto: UpdateProfileDto) {
    const userFields = ['name', 'image'];
    const profileFields = ['birthday', 'gender', 'address', 'about', 'country_id', 'province_id', 'ward_id'];

    const userPayload: any = {};
    const profileRawData: any = {};
    const dtoAny = dto as any;

    Object.keys(dto).forEach(key => {
      if (userFields.includes(key)) {
        userPayload[key] = dtoAny[key];
      } else if (profileFields.includes(key)) {
        profileRawData[key] = dtoAny[key];
      }
    });

    if (Object.keys(profileRawData).length > 0) {
      const profileData = this.userRepo.prepareProfileData(profileRawData);
      userPayload.profile = {
        upsert: {
          create: profileData,
          update: profileData
        }
      };
    }

    return this.userRepo.update(userId, userPayload);
  }

  // ── Password Operations ────────────────────────────────────────────────────

  async changePassword(userId: any, oldPassword: string, newPassword: string) {
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


