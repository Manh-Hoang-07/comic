import { ForbiddenException } from '@nestjs/common';
import { RequestContext } from '@/common/shared/utils';

/**
 * Interface cho entity có group_id
 */
export interface GroupOwnedEntity {
  group_id?: any | null;
}

/**
 * Verify ownership: kiểm tra entity có thuộc về group hiện tại không
 *
 * @param entity - Entity có group_id (Product, Order, Post, Coupon, Warehouse, ...)
 * @throws ForbiddenException nếu không có quyền truy cập
 *
 * @example
 * ```typescript
 * verifyGroupOwnership(product);
 * verifyGroupOwnership(order);
 * ```
 */
export function verifyGroupOwnership(entity: GroupOwnedEntity): void {
  const context = RequestContext.get<any>('context');
  const groupId = RequestContext.get<any>('groupId');

  // Nếu là system context -> có thể truy cập tất cả entities
  if (context?.type === 'system') {
    return;
  }

  // Nếu không có cả context lẫn groupId -> không có quyền (không có thông tin context điều hướng)
  if (!context && !groupId) {
    throw new ForbiddenException(
      'Unable to verify record ownership: no context information available.',
    );
  }

  // Group khác: chỉ được truy cập entities có group_id = groupId hiện tại
  if (entity.group_id !== null && entity.group_id !== undefined) {
    if (entity.group_id !== groupId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập bản ghi này. Bản ghi thuộc về group khác.',
      );
    }
  } else {
    // Entity không có group_id (global) → chỉ system group mới được truy cập
    throw new ForbiddenException(
      'Bạn không có quyền truy cập bản ghi này. Bản ghi này thuộc về system group.',
    );
  }
}

/**
 * @deprecated Use verifyGroupOwnership instead
 * Verify ownership: kiểm tra entity có thuộc về group hiện tại không
 */
export function verifyContextOwnership(entity: GroupOwnedEntity): void {
  verifyGroupOwnership(entity);
}

/**
 * Helper to get group filter based on context
 *
 * Nếu là system context (quản trị toàn cục) thì không ép lọc theo group_id (trả về {})
 * Ngược lại, ép chặt vào groupId hiện hành trả về { group_id: groupId }
 */
export function getGroupFilter(_currentFilter?: any): {
  group_id?: any;
  groupId?: any;
} {
  const context = RequestContext.get<any>('context');
  const groupId = RequestContext.get<any>('groupId');

  // 1. Ngữ cảnh toàn cục (system context) -> không bị ép group_id (view tất cả).
  if (context?.type === 'system') {
    return {};
  }

  // 2. Không phải system -> bị ép chặt vào groupId hiện hành!
  return groupId ? { group_id: groupId, groupId } : {};
}
/**
 * Tự động gán group_id cho payload dựa trên context hiện tại.
 * Nếu là system context (quản tài hệ thống) -> group_id = null.
 * Nếu là group context -> group_id = currentGroupId.
 *
 * @param payload - Object cần gán group_id
 */
export function assignGroupOwnership(payload: any): void {
  const context = RequestContext.get<any>('context');
  const groupId = RequestContext.get<any>('groupId');

  // Nếu đã có group_id trong payload (do người dùng chủ động gửi), không ghi đè
  if (payload.group_id !== undefined) {
    return;
  }

  if (context?.type === 'system') {
    payload.group_id = null;
  } else {
    payload.group_id = groupId || null;
  }
}
