import { RedisUtil } from '@/core/utils/redis.util';

/** TTL an toàn khi thiếu đường invalidate (membership đổi hiếm). */
export const USER_GROUPS_LIST_TTL_SEC = 3600;

export function userGroupsListCacheKey(userId: any): string {
  return `user:groups:list:${String(userId)}`;
}

export async function invalidateUserGroupsListCache(
  redis: RedisUtil,
  userId: any,
): Promise<void> {
  if (!redis.isEnabled()) return;
  await redis.del(userGroupsListCacheKey(userId));
}
