import { Body, Controller, Get, Patch, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserChangePasswordDto } from '../dtos/user-change-password.dto';
import { Auth } from '@/common/auth/utils';
import { JwtAuthGuard } from '@/common/auth/guards';
import { LogRequest } from '@/common/shared/decorators';
import { Permission } from '@/common/auth/decorators';

@Controller('user/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly service: ProfileService) { }

  @Permission('authenticated')
  @Get()
  async getMe() {
    const userId = Auth.id();
    if (!userId) throw new UnauthorizedException();
    return this.service.getProfile(Number(userId));
  }

  @Permission('authenticated')
  @LogRequest({ fileBaseName: 'user_update_profile' })
  @Patch()
  async updateMe(@Body() dto: UpdateProfileDto) {
    const userId = Auth.id();
    if (!userId) throw new UnauthorizedException();
    return this.service.updateProfile(Number(userId), dto);
  }

  @Permission('authenticated')
  @LogRequest({ fileBaseName: 'user_change_password' })
  @Patch('change-password')
  async changePassword(@Body() dto: UserChangePasswordDto) {
    const userId = Auth.id();
    if (!userId) throw new UnauthorizedException();
    return this.service.changePassword(Number(userId), dto.old_password, dto.password);
  }
}

