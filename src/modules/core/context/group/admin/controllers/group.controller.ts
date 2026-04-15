import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { AdminGroupService } from '../services/group.service';
import { RequestContext } from '@/common/shared/utils';

/**
 * Controller cho System Admin quản lý Groups
 * Routes: /api/admin/groups
 */
@Controller('admin/groups')
export class AdminGroupController {
  constructor(private readonly groupService: AdminGroupService) {}

  /**
   * Tạo group mới (chỉ system admin)
   */
  @Permission('group.manage')
  @Post()
  async createGroup(
    @Body()
    body: {
      type: string;
      code: string;
      name: string;
      description?: string;
      metadata?: any;
      context_id: any;
    },
  ) {
    const userId = Auth.id();
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    return this.groupService.createGroup(
      {
        ...body,
        owner_id: userId, // Tự động set owner là user hiện tại
      },
      userId, // Pass requester user ID để check system admin
    );
  }

  /**
   * Lấy danh sách tất cả groups (chuẩn phân trang hệ thống)
   * - Hỗ trợ query chuẩn: page, limit, sort
   * - Hỗ trợ filters[type], filters[status], ...
   */
  @Permission('public')
  @Get()
  async getGroups(@Query() query: any) {
    return this.groupService.getList(query);
  }

  /**
   * Lấy danh sách group (đơn giản cho dropdown)
   */
  @Permission('public')
  @Get('simple')
  async getSimpleList(@Query() query: any) {
    return this.groupService.getSimpleList(query);
  }

  /**
   * Lấy danh sách groups theo type
   */
  @Permission('public')
  @Get('type/:type')
  async getGroupsByType(@Param('type') type: string, @Query() query: any) {
    return this.groupService.getList({ ...query, type });
  }

  /**
   * Lấy group theo ID
   */
  @Permission('public')
  @Get(':id')
  async getGroup(@Param('id') id: any) {
    return this.groupService.getOne(id);
  }

  /**
   * Update group (chỉ system admin)
   */
  @Permission('group.manage')
  @Put(':id')
  async updateGroup(
    @Param('id') id: any,
    @Body() body: Partial<{ name: string; description: string; metadata: any }>,
  ) {
    const userId = Auth.id();
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Check system context
    const context = RequestContext.get<any>('context');
    if (context?.type !== 'system') {
      throw new ForbiddenException(
        'Groups can only be updated under the system context',
      );
    }

    return this.groupService.update(id, body);
  }

  /**
   * Xóa group (chỉ system admin)
   */
  @Permission('group.manage')
  @Delete(':id')
  async deleteGroup(@Param('id') id: any) {
    const userId = Auth.id();
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Check system context
    const context = RequestContext.get<any>('context');
    if (context?.type !== 'system') {
      throw new ForbiddenException(
        'Groups can only be deleted under the system context',
      );
    }

    await this.groupService.delete(id);
    return { message: 'Group deleted successfully' };
  }
}
