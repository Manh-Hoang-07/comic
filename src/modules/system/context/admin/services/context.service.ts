import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  IContextRepository,
  CONTEXT_REPOSITORY,
} from '@/modules/system/context/domain/context.repository';
import {
  IGroupRepository,
  GROUP_REPOSITORY,
} from '@/modules/system/group/domain/group.repository';
import { BaseService } from '@/common/core/services';
import {
  ContextType,
  SYSTEM_CONTEXT_CODE,
} from '@/modules/system/rbac/rbac.constants';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class AdminContextService extends BaseService<any, IContextRepository> {
  private systemContextCache: any = null;

  constructor(
    @Inject(CONTEXT_REPOSITORY)
    private readonly contextRepo: IContextRepository,
    @Inject(GROUP_REPOSITORY)
    private readonly groupRepo: IGroupRepository,
  ) {
    super(contextRepo);
  }

  protected defaultSort = 'id:desc';

  /**
   * Lấy System Context (có cache)
   */
  async getSystemContext() {
    if (this.systemContextCache) return this.systemContextCache;

    const context = await this.contextRepo.findByCode(SYSTEM_CONTEXT_CODE);
    if (!context) {
      // Fallback: tìm theo type nếu code chưa đúng
      const byType = await this.contextRepo.findFirstRaw({
        where: { type: ContextType.SYSTEM, status: 'active' as any },
      });
      this.systemContextCache = byType;
    } else {
      this.systemContextCache = context;
    }

    return this.systemContextCache;
  }

  async findById(id: any) {
    const context = await this.contextRepo.findOne({
      id,
      status: 'active',
    });
    return this.transform(context);
  }

  async findByTypeAndRefId(type: string, refId: any | null) {
    const context = await this.contextRepo.findByTypeAndRefId(type, refId);
    return this.transform(context);
  }

  protected async beforeCreate(data: any) {
    const existing = await this.contextRepo.findByTypeAndRefId(
      data.type,
      data.ref_id ?? null,
    );
    if (existing) {
      throw new BadRequestException(
        `Context với loại "${data.type}" và ref_id "${data.ref_id ?? 'null'}" đã tồn tại`,
      );
    }

    const code = data.code || `${data.type}-${data.ref_id ?? 'system'}`;
    const existingByCode = await this.contextRepo.findByCode(code);
    if (existingByCode) {
      throw new BadRequestException(`Context với mã "${code}" đã tồn tại`);
    }

    const payload = {
      ...data,
      ref_id: data.ref_id ? toPrimaryKey(data.ref_id) : null,
      code,
      status: data.status || 'active',
    };
    return payload;
  }

  protected async afterCreate(): Promise<void> {
    this.systemContextCache = null;
  }

  protected async beforeUpdate(id: any, data: any) {
    const current = await this.contextRepo.findById(id);
    if (!current) throw new NotFoundException('Context không tồn tại');

    if (
      current.type === ContextType.SYSTEM ||
      current.code === SYSTEM_CONTEXT_CODE
    ) {
      throw new BadRequestException('Không thể cập nhật context hệ thống');
    }

    if (data.code && data.code !== current.code) {
      const existing = await this.contextRepo.findByCode(data.code);
      if (existing) {
        throw new BadRequestException(
          `Context với mã "${data.code}" đã tồn tại`,
        );
      }
    }

    if (data.ref_id !== undefined) {
      data.ref_id = data.ref_id ? toPrimaryKey(data.ref_id) : null;
    }

    return data;
  }

  protected async afterUpdate(): Promise<void> {
    this.systemContextCache = null;
  }

  protected async beforeDelete(id: any): Promise<boolean> {
    const current = await this.contextRepo.findById(id);
    if (!current) throw new NotFoundException('Context không tồn tại');

    if (
      current.type === ContextType.SYSTEM ||
      current.code === SYSTEM_CONTEXT_CODE
    ) {
      throw new BadRequestException('Không thể xóa context hệ thống');
    }

    const groups = await this.groupRepo.findManyRaw({
      where: { context_id: toPrimaryKey(id) },
    });

    if (groups.length > 0) {
      throw new BadRequestException(
        `Không thể xóa context: ${groups.length} group đang sử dụng context này`,
      );
    }
    return true;
  }

  protected async afterDelete(): Promise<void> {
    this.systemContextCache = null;
  }
}
