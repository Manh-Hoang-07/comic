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
import { AdminContextService } from '../services/context.service';

/**
 * Controller cho System Admin quản lý Contexts
 * Routes: /api/admin/contexts
 */
@Controller('admin/contexts')
export class AdminContextController {
  constructor(private readonly contextService: AdminContextService) {}

  /**
   * Tạo context mới (chỉ system admin)
   */
  @Permission('context.manage')
  @Post()
  async create(
    @Body()
    body: {
      type: string;
      ref_id?: any | null;
      name: string;
      code?: string;
      status?: string;
    },
  ) {
    return this.contextService.create(body);
  }

  /**
   * Lấy danh sách tất cả contexts (chuẩn phân trang hệ thống)
   * - Hỗ trợ query chuẩn: page, limit, sort
   * - Hỗ trợ filters[type], filters[status], ...
   */
  @Permission('context.manage')
  @Get()
  async getList(@Query() query: any) {
    return this.contextService.getList(query);
  }

  /**
   * Lấy danh sách context (đơn giản cho dropdown)
   */
  @Permission('context.manage')
  @Get('simple')
  async getSimpleList(@Query() query: any) {
    return this.contextService.getSimpleList(query);
  }

  /**
   * Lấy context theo ID
   */
  @Permission('context.manage')
  @Get(':id')
  async getOne(@Param('id') id: any) {
    return this.contextService.findById(id);
  }

  /**
   * Update context (chỉ system admin)
   */
  @Permission('context.manage')
  @Put(':id')
  async updateContext(
    @Param('id') id: any,
    @Body() body: Partial<{ name: string; code: string; status: string }>,
  ) {
    return this.contextService.update(id, body);
  }

  /**
   * Xóa context (chỉ system admin)
   */
  @Permission('context.manage')
  @Delete(':id')
  async deleteContext(@Param('id') id: any) {
    await this.contextService.delete(id);
    return { message: 'Context deleted successfully' };
  }
}
