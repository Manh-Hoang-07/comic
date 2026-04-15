import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { UserGroupService } from '../services/group.service';

/**
 * Controller cho Owner/User quản lý Members trong Group
 * Routes: /api/groups/:id/members
 *
 * Route không có "admin" vì đây là quản lý trong context của group,
 * không phải system admin. Permission check sẽ quyết định ai được phép.
 */
@Controller('groups')
export class GroupMemberController {
  constructor(private readonly groupService: UserGroupService) {}

  /**
   * Thêm member vào group (owner hoặc user có permission trong context)
   */
  @Permission('group.member.add')
  @Post(':id/members')
  async addMember(
    @Param('id') groupId: any,
    @Body() body: { user_id: any; role_ids: any[] },
  ) {
    const userId = Auth.id();
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    await this.groupService.addMember(
      groupId,
      body.user_id,
      body.role_ids,
      userId,
    );
    return { message: 'Member added successfully' };
  }

  /**
   * Gán roles cho member trong group (owner hoặc user có permission trong context)
   */
  @Permission('group.member.manage')
  @Put(':id/members/:memberId/roles')
  async assignRolesToMember(
    @Param('id') groupId: any,
    @Param('memberId') memberId: any,
    @Body() body: { role_ids: any[] },
  ) {
    const userId = Auth.id();
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    await this.groupService.assignRolesToMember(
      groupId,
      memberId,
      body.role_ids,
      userId,
    );
    return { message: 'Roles assigned successfully' };
  }

  /**
   * Xóa member khỏi group (owner hoặc user có permission trong context)
   */
  @Permission('group.member.remove')
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') groupId: any,
    @Param('memberId') memberId: any,
  ) {
    const userId = Auth.id();
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    await this.groupService.removeMember(groupId, memberId, userId);
    return { message: 'Member removed successfully' };
  }

  /**
   * Lấy danh sách members của group
   */
  @Permission('public')
  @Get(':id/members')
  async getGroupMembers(@Param('id') id: any) {
    return this.groupService.getGroupMembers(id);
  }
}
