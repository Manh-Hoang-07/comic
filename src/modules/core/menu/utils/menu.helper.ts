import { MenuTreeItem } from '../admin/interfaces/menu-tree-item.interface';

/**
 * Builds a hierarchical tree from a flat list of menu items.
 */
export function buildMenuTree(menus: any[]): MenuTreeItem[] {
  const menuMap = new Map<any, MenuTreeItem>();
  const rootMenus: MenuTreeItem[] = [];

  // Initialize map
  menus.forEach((menu) => {
    const id = menu.id;
    menuMap.set(id, {
      id,
      code: menu.code,
      name: menu.name,
      path: menu.path,
      icon: menu.icon,
      type: menu.type,
      status: menu.status,
      is_public: !!menu.is_public,
      children: [],
      allowed: true,
    } as MenuTreeItem);
  });

  // Link children to parents
  menus.forEach((menu) => {
    const item = menuMap.get(menu.id)!;
    const parentId = menu.parent_id;

    if (parentId && menuMap.has(parentId)) {
      menuMap.get(parentId)!.children!.push(item);
    } else {
      rootMenus.push(item);
    }
  });

  // Define recursive sort
  const sortTree = (items: MenuTreeItem[]) => {
    items.sort((a, b) => {
      const menuA = menus.find((m) => String(m.id) === String(a.id));
      const menuB = menus.find((m) => String(m.id) === String(b.id));
      return (menuA?.sort_order || 0) - (menuB?.sort_order || 0);
    });
    items.forEach((item) => {
      if (item.children?.length) {
        sortTree(item.children);
      }
    });
  };

  sortTree(rootMenus);
  return rootMenus;
}

/**
 * Filters a list of menus based on client-side constraints (public or logged in).
 */
export function filterClientMenus(menus: any[], userId?: any): any[] {
  return menus.filter((menu) => {
    if (menu.is_public) return true;
    if (userId) return true;
    return false;
  });
}

/**
 * Filters a list of menus based on RBAC permissions for Admin/Dashboard.
 * Truyền matcher từ RbacService để áp dụng kế thừa quyền cha và `system.manage`.
 */
export function filterAdminMenus(
  menus: any[],
  userPerms: Set<string>,
  matches: (assigned: Set<string>, requiredCode: string) => boolean = () =>
    false,
): any[] {
  return menus.filter((menu) => {
    // Public menus are always shown
    if (menu.is_public) return true;

    // Menus with no required permissions
    const hasRequiredPerm = !!menu.required_permission_id;
    const hasAssignedPerms = !!(
      menu.menu_permissions && menu.menu_permissions.length > 0
    );

    if (!hasRequiredPerm && !hasAssignedPerms) return true;

    // Check primary permission
    if (
      menu.required_permission?.code &&
      matches(userPerms, menu.required_permission.code)
    ) {
      return true;
    }

    // Check secondary permissions (many-to-many)
    if (menu.menu_permissions?.length) {
      return menu.menu_permissions.some(
        (mp: any) =>
          mp.permission?.code && matches(userPerms, mp.permission.code),
      );
    }

    return false;
  });
}
