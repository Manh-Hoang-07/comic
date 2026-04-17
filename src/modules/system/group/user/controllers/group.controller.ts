import { Controller, Get } from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { UserGroupService } from '../services/group.service';

/**
 * Controller cho user quản lý groups của chính họ
 * Route: /api/user/groups
 */
@Controller('user/groups')
export class UserGroupController {
  constructor(private readonly groupService: UserGroupService) {}

  /**
   * ✅ MỚI: Lấy danh sách groups mà user hiện tại là member, kèm roles trong mỗi group
   * Route: GET /api/user/groups
   */
  @Permission('public')
  @Get()
  async getMyGroups() {
    const userId = Auth.id();
    if (!userId) {
      return [];
    }

    const groups = await this.groupService.getUserGroups(userId);
    return groups;
  }
}
