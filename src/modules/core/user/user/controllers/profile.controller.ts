import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserChangePasswordDto } from '../dtos/user-change-password.dto';
import { Auth } from '@/common/auth/utils';
import { JwtAuthGuard } from '@/common/auth/guards';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';

@ApiTags('User / Profile')
@ApiBearerAuth('access-token')
@Controller('user/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly service: ProfileService) { }

  // ── Profile Management ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
  @Permission('user')
  @Get()
  async getMe() {
    const userId = Auth.id();
    return this.service.getProfile(userId);
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
    return this.service.changePassword(userId, dto.old_password, dto.password);
  }
}
