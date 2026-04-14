import { SetMetadata } from '@nestjs/common';

export const PERMS_REQUIRED_KEY = 'perms_required';

// Permission constant để đánh dấu route public
export const PUBLIC_PERMISSION = 'public';

/**
 * Decorator đơn giản để kiểm tra permission
 *
 * RBAC v2 policy:
 * - Không có `@Permission(...)` → mặc định deny (403)
 * - Có `@Permission('public')` → public route (không cần authentication)
 * - Có `@Permission('user')` → chỉ cần authentication (không cần RBAC)
 * - Có `@Permission('some.permission')` → cần RBAC cho permission tương ứng
 */
export const Permission = (...permissions: string[]) =>
  SetMetadata(PERMS_REQUIRED_KEY, permissions);
