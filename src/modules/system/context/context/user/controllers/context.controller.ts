import { Controller, Get } from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { UserContextService } from '../services/context.service';

@Controller('user/contexts')
export class ContextController {
  constructor(private readonly contextService: UserContextService) {}

  /**
   * Lấy các contexts được phép truy cập
   * - System context (id=1) luôn được phép cho mọi user đã authenticated
   * - Các contexts khác chỉ được phép nếu user có role trong đó
   */
  @Permission('public')
  @Get()
  async getUserContexts() {
    const userId = Auth.id();
    if (!userId) {
      return [];
    }

    const contexts =
      await this.contextService.getUserContextsForTransfer(userId);
    return contexts.map((ctx) => ({
      id: ctx.id.toString(),
      type: ctx.type,
      ref_id: ctx.ref_id?.toString() || null,
      name: ctx.name,
    }));
  }
}
