import { Injectable, Inject, BadRequestException, NotFoundException, forwardRef } from '@nestjs/common';
import { IMenuRepository, MENU_REPOSITORY, MenuFilter } from '@/modules/core/menu/domain/menu.repository';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RequestContext } from '@/common/shared/utils';
import { BasicStatus } from '@/shared/enums/types/basic-status.enum';
import { MenuTreeItem } from '@/modules/core/menu/admin/interfaces/menu-tree-item.interface';
import { BaseService } from '@/common/core/services';
import { buildMenuTree, filterAdminMenus, filterClientMenus } from '@/modules/core/menu/utils/menu.helper';
import { toPrimaryKey } from '@/common/core/utils/primary-key.util';

@Injectable()
export class MenuService extends BaseService<any, IMenuRepository> {
  constructor(
    @Inject(MENU_REPOSITORY)
    private readonly menuRepo: IMenuRepository,
    @Inject(forwardRef(() => RbacService))
    private readonly rbacService: RbacService,
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

  async deleteById(id: any) {
    return this.delete(id);
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
    const menus = await this.menuRepo.findAllWithChildren();
    return buildMenuTree(menus);
  }

  async getUserMenus(userId?: any, filters: MenuFilter = {}): Promise<MenuTreeItem[]> {
    const group = filters.group || 'admin';
    const dbFilter: MenuFilter = { ...filters, group, status: BasicStatus.active };

    const allMenus = await this.menuRepo.findAllWithChildren(dbFilter);
    const menus = (allMenus as any[]).filter((m) => m.show_in_menu);

    if (!menus.length) return [];

    let filtered: any[];
    if (group === 'client') {
      filtered = filterClientMenus(menus, userId);
    } else {
      if (!userId) return [];
      const groupId = RequestContext.get<any>('groupId');
      const userPerms = await this.rbacService.getUserPermissions(userId, groupId ?? null);
      filtered = filterAdminMenus(menus, userPerms);
    }

    return buildMenuTree(filtered);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private preparePayload(data: any): any {
    const payload = { ...data };
    const bigIntFields = ['parent_id', 'required_permission_id', 'created_user_id', 'updated_user_id'];
    bigIntFields.forEach((field) => {
      if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
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


