import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  IMenuRepository,
  MENU_REPOSITORY,
  MenuFilter,
} from '@/modules/system/menu/domain/menu.repository';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';
import { MenuTreeItem } from '@/modules/system/menu/admin/interfaces/menu-tree-item.interface';
import { BaseService } from '@/common/core/services';
import { stableObjectJsonForCache } from '@/common/core/utils/cache-key.helper';
import { RedisUtil } from '@/core/utils/redis.util';
import {
  buildMenuTree,
  filterAdminMenus,
  filterClientMenus,
} from '@/modules/system/menu/utils/menu.helper';
import { toPrimaryKey } from '@/common/core/utils/primary-key.util';

/** Raw cây menu ít đổi — cache Redis; bust toàn bộ prefix khi CRUD menu. */
const MENU_TREE_RAW_PREFIX = 'menu:tree:raw:';
const MENU_TREE_RAW_TTL_SEC = 3600;

@Injectable()
export class MenuService extends BaseService<any, IMenuRepository> {
  constructor(
    @Inject(MENU_REPOSITORY)
    private readonly menuRepo: IMenuRepository,
    @Inject(forwardRef(() => RbacService))
    private readonly rbacService: RbacService,
    private readonly redis: RedisUtil,
  ) {
    super(menuRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({
      ...query,
      limit: query.limit ?? 50,
      sort: query.sort ?? 'sort_order:ASC',
    });
  }

  // ── Extended CRUD Operations ───────────────────────────────────────────────

  async createWithUser(data: any, userId?: any) {
    if (userId) data.created_user_id = userId;
    return this.create(data);
  }

  async updateById(id: any, data: any, userId?: any) {
    if (userId) data.updated_user_id = userId;
    return this.update(id, data);
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected async beforeCreate(data: any) {
    const payload = this.preparePayload(data);
    if (payload.code && (await this.menuRepo.findByCode(payload.code))) {
      throw new BadRequestException('Menu code already exists');
    }
    return payload;
  }

  protected async beforeUpdate(id: any, data: any) {
    const current = await this.menuRepo.findById(id);
    if (!current) throw new NotFoundException('Menu not found');

    const payload = this.preparePayload(data);
    if (payload.code && payload.code !== (current as any).code) {
      if (await this.menuRepo.findByCode(payload.code)) {
        throw new BadRequestException('Menu code already exists');
      }
    }
    return payload;
  }

  // ── Tree Logic ─────────────────────────────────────────────────────────────

  async getTree(): Promise<MenuTreeItem[]> {
    const menus = await this.findAllWithChildrenCached({});
    return buildMenuTree(menus);
  }

  async getUserMenus(
    userId?: any,
    filters: MenuFilter = {},
  ): Promise<MenuTreeItem[]> {
    const group = filters.group || 'admin';
    const dbFilter: MenuFilter = {
      ...filters,
      group,
      status: BasicStatus.active,
    };

    const { rows: allMenus, fromCache: _fromCache } =
      await this.findAllWithChildrenCachedWithMeta(dbFilter);
    const menus = (allMenus as any[]).filter((m) => m.show_in_menu);

    if (!menus.length) {
      return [];
    }

    let filtered: any[];
    if (group === 'client') {
      filtered = filterClientMenus(menus, userId);
    } else {
      if (!userId) return [];
      const groupId = RequestContext.get<any>('groupId');
      await this.rbacService.prepare();
      const userPerms = await this.rbacService.getPermissions(
        userId,
        groupId ?? null,
      );
      filtered = filterAdminMenus(menus, userPerms, (assigned, code) =>
        this.rbacService.hasCode(assigned, code),
      );
      return buildMenuTree(filtered);
    }

    return buildMenuTree(filtered);
  }

  protected async afterCreate(_entity: any, _data: any): Promise<void> {
    await this.bustMenuTreeCache();
  }

  protected async afterUpdate(_entity: any, _data: any): Promise<void> {
    await this.bustMenuTreeCache();
  }

  protected async afterDelete(_id: any): Promise<void> {
    await this.bustMenuTreeCache();
  }

  private menuTreeRawCacheKey(dbFilter: MenuFilter): string {
    return `${MENU_TREE_RAW_PREFIX}${stableObjectJsonForCache(dbFilter)}`;
  }

  private async findAllWithChildrenCached(
    dbFilter: MenuFilter,
  ): Promise<any[]> {
    const { rows } = await this.findAllWithChildrenCachedWithMeta(dbFilter);
    return rows;
  }

  private async findAllWithChildrenCachedWithMeta(
    dbFilter: MenuFilter,
  ): Promise<{ rows: any[]; fromCache: boolean }> {
    if (!this.redis.isEnabled()) {
      const rows = await this.menuRepo.findAllWithChildren(dbFilter);
      return { rows, fromCache: false };
    }
    const cacheKey = this.menuTreeRawCacheKey(dbFilter);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        const rows = JSON.parse(cached) as any[];
        return { rows, fromCache: true };
      } catch {
        /* load DB */
      }
    }
    const rows = await this.menuRepo.findAllWithChildren(dbFilter);
    await this.redis.set(cacheKey, JSON.stringify(rows), MENU_TREE_RAW_TTL_SEC);
    return { rows, fromCache: false };
  }

  private async bustMenuTreeCache(): Promise<void> {
    if (!this.redis.isEnabled()) return;
    const keys = await this.redis.scan(`${MENU_TREE_RAW_PREFIX}*`);
    if (keys.length) await this.redis.unlinkMany(keys);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private preparePayload(data: any): any {
    const payload = { ...data };
    const bigIntFields = [
      'parent_id',
      'required_permission_id',
      'created_user_id',
      'updated_user_id',
    ];
    bigIntFields.forEach((field) => {
      if (
        payload[field] !== undefined &&
        payload[field] !== null &&
        payload[field] !== ''
      ) {
        payload[field] = toPrimaryKey(payload[field]);
      } else if (payload[field] === '' || payload[field] === null) {
        payload[field] = null;
      }
    });
    return payload;
  }

  protected transform(entity: any): any {
    if (!entity) return entity;
    const item = super.transform(entity) as any;

    if (item.menu_permissions) {
      item.menu_permissions = item.menu_permissions.map((mp: any) => ({
        ...mp,
        id: mp.id,
        menu_id: mp.menu_id,
        permission_id: mp.permission_id,
      }));
    }
    return item;
  }
}
