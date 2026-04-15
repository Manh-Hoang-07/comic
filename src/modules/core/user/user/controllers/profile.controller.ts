import {
  Body,
  Controller,
  Get,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserChangePasswordDto } from '../dtos/user-change-password.dto';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';

@ApiTags('User / Profile')
@ApiBearerAuth('access-token')
@Controller('user/profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  // ── Profile Management ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @Permission('user')
  @Get()
  async getMe() {
    const userId = Auth.id();
    if (!userId) {
      throw new UnauthorizedException('Auth required');
    }
    return this.service.getProfile(userId, Auth.user());
  }

  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  @Permission('user')
  @LogRequest({ fileBaseName: 'user_update_profile' })
  @Patch()
  async updateMe(@Body() dto: UpdateProfileDto) {
    const userId = Auth.id();
    return this.service.updateProfile(userId, dto);
  }

  @ApiOperation({ summary: 'Đổi mật khẩu cá nhân' })
  @Permission('user')
  @LogRequest({ fileBaseName: 'user_change_password' })
  @Patch('change-password')
  async changePassword(@Body() dto: UserChangePasswordDto) {
    const userId = Auth.id();
    return this.service.changePassword(userId!, dto.old_password, dto.password);
  }
}
