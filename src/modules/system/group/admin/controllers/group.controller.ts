import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { AdminGroupService } from '../services/group.service';

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
      owner_id?: any;
    },
  ) {
    return this.groupService.create(body);
  }

  /**
   * Lấy danh sách tất cả groups (chuẩn phân trang hệ thống)
   * - Hỗ trợ query chuẩn: page, limit, sort
   * - Hỗ trợ filters[type], filters[status], ...
   */
  @Permission('group.manage')
  @Get()
  async getGroups(@Query() query: any) {
    return this.groupService.getList(query);
  }

  /**
   * Lấy danh sách group (đơn giản cho dropdown)
   */
  @Permission('group.manage')
  @Get('simple')
  async getSimpleList(@Query() query: any) {
    return this.groupService.getSimpleList(query);
  }

  /**
   * Lấy danh sách groups theo type
   */
  @Permission('group.manage')
  @Get('type/:type')
  async getGroupsByType(@Param('type') type: string, @Query() query: any) {
    return this.groupService.getList({ ...query, type });
  }

  /**
   * Lấy group theo ID
   */
  @Permission('group.manage')
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
    return this.groupService.update(id, body);
  }

  /**
   * Xóa group (chỉ system admin)
   */
  @Permission('group.manage')
  @Delete(':id')
  async deleteGroup(@Param('id') id: any) {
    await this.groupService.delete(id);
    return { message: 'Group deleted successfully' };
  }
}
