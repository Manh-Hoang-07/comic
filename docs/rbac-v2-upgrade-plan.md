## Mục tiêu

Thiết kế lại phần phân quyền theo hướng:

- **Dễ hiểu / ít đường đi**: chỉ 1 đường check quyền, 1 chuẩn cache key, 1 cơ chế invalidation.
- **Hiệu năng cao**: steady-state check quyền **không query DB** (chỉ Request-cache + L1 + Redis).
- **Near realtime**: khi thay đổi role/member, quyền cập nhật gần như ngay (multi-instance).
- **Phù hợp dữ liệu “ít đổi”**: `permission` và `context` hầu như chỉ thêm mới.

Quyết định đã chốt:

- **Default-deny**: endpoint không gắn `@Permission(...)` ⇒ 403.
- **Group-only**: request có `groupId` thì **chỉ** check trong group đó (không fallback system).
- **Phương án A**: giữ **versioning + bumpVersion()** cho thay đổi global; còn thay đổi theo user+group thì **invalidate đúng key**.

---

## Tổng quan kiến trúc (RBAC v2)

### Hai cấu trúc runtime (đủ để chạy nhanh)

1) **PermissionIndex (in-memory)**  
Nhiệm vụ: hỗ trợ match quyền theo **exact** hoặc **parent inheritance**.

2) **AssignedPermissionsBitmap(userId, groupId) (Redis String Blob + L1)**  
Nhiệm vụ: giữ tập quyền hiệu lực của user trong group theo dạng **bitmap/packed-bytes** để:

- hot-path chỉ cần **1 lần GET** (hoặc L1 hit thì 0 Redis)
- check quyền **O(1)** theo index
- payload nhỏ hơn nhiều so với `SMEMBERS` của Redis Set (đặc biệt khi permission set lớn)

#### Map permission → bit index

- Permission catalog có `permission.id` (bigint) nhưng không “dense”; để bitmap nhỏ ta dùng **dense index**.
- Tạo `PermissionDenseIndex` (in-memory) từ `PermissionIndex`:
  - `permCode -> denseIndex` (0..N-1)
  - `denseIndex -> permCode` (chỉ cần nếu debug/telemetry)
- `PermissionDenseIndex` refresh cùng event `perm_index_refresh`.

#### Format lưu trong Redis

- **Key**: `rbac:v{version}:u:{userId}:g:{groupId}`
- **Value**: base64 của `Uint8Array` (bitset), kèm prefix version format để backward-compatible. Ví dụ:
  - `b64:v1:<base64bytes>`
- **TTL**: 1 ngày (khuyến nghị)

Lưu ý: bitmap chỉ encode “assigned effective permissions” theo **code** (thông qua denseIndex). Logic “parent inheritance” vẫn dùng `PermissionIndex` để resolve (xem mục check).

### Hợp đồng check quyền (API logic)

- **Input**: `(userId, groupId, requiredPermissions[])`
- **Output**: `allowed: boolean`
- **Cache key**: `rbac:v{version}:u:{userId}:g:{groupId}`

### Luồng request end-to-end

0) (NestJS order) **Middleware luôn chạy trước Guard**. Vì vậy cần tách rõ:
   - middleware chỉ **parse header** (rẻ)
   - guard/service mới **validate/resolve** (đắt) theo nhu cầu route

1) `GroupContextMiddleware` (**parse-only**):
   - đọc header `X-Group-Id` (nếu có) và set `groupIdRaw`/`groupId`
   - **không query DB/Redis**, **không throw** chỉ vì group header sai (để public/user không bị ảnh hưởng)

2) `JwtAuthGuard`: resolve `userId` (nếu route không public).

3) `RbacGuard`:
   - đọc `requiredPermissions` từ decorator
   - nếu `public` hoặc `user` ⇒ cho qua, **không cần validate group**
   - nếu cần RBAC thật:
     - validate `groupId`/context theo policy (admin route có thể strict)
     - gọi `RbacService.check(...)`

4) `RbacService.check(...)`:
   - ensure `PermissionIndex` sẵn
   - load `AssignedPermissionsBitmap` theo thứ tự:
     - request-cache (AsyncLocalStorage)
     - L1 in-process (TTL ngắn)
     - Redis String Blob (TTL dài)
     - miss ⇒ DB recompute 1 lần ⇒ write lại Redis
   - match required bằng PermissionIndex + DenseIndex:
     - route đa số chỉ có 1 permission ⇒ check 1 bit là đủ
     - với permission có parent: PermissionIndex cung cấp chain ancestors; kiểm tra bit của `need` hoặc bất kỳ ancestor

---

## Cache policy (TTL)

### AssignedPermissionsBitmap (user+group)

- **Redis TTL**: 1 ngày (khuyến nghị)
- **L1 TTL**: 30–60s
- **Request-cache**: theo request

Lưu ý: TTL dài **không gây stale** nếu invalidation đúng (mục Invalidation).

### PermissionIndex (permission catalog)

- **TTL (in-memory)**: 1 ngày
- **Refresh**: theo event `perm_index_refresh` (pub/sub) + lazy-load lần đầu

---

## Invalidation policy (Near realtime) — Phương án A

### 1) Invalidate theo key (local impact)

Dùng khi thay đổi chỉ ảnh hưởng 1 user trong 1 group:

- **UserRolesChanged(userId, groupId)** (assign/sync role cho user trong group)
- **GroupMemberChanged(userId, groupId)** (add/remove member)

Action:

- Invalidate đúng **permission-bitmap key** của user+group.
- Có thể chọn:
  - **delete key** để lazy refresh ở request kế tiếp, hoặc
  - **recompute + set** ngay (nếu muốn “warm cache”).

Khuyến nghị: với near realtime, nên **recompute + set** ngay tại write path (assign/sync), còn add/remove member có thể delete là đủ.

### 2) Bump version (global impact)

Dùng khi thay đổi ảnh hưởng diện rộng khó trace user:

- **RolePermissionsChanged(roleId)**: đổi `role_has_permission`, enable/disable role/permission
- **PermissionsCatalogChanged()**: đổi hierarchy `permission.parent_id` (hiếm)

Action:

- `rbacCache.bumpVersion()` để invalidate toàn cluster.
- Đồng thời bắn event `perm_index_refresh` để mọi instance refresh PermissionIndex ngay.
  - Vì DenseIndex phụ thuộc permission catalog, nó cũng refresh theo event này.

---

## Danh sách file sẽ chạm (mapping vào code hiện tại)

### RBAC core

- `src/modules/core/rbac/services/rbac.service.ts`
  - đổi check thành **group-only**
  - chuẩn hoá 1 entry point `check(...)`/`userHasPermissionsInGroup(...)` không loop 2 scopes

- `src/modules/core/rbac/services/rbac-cache.service.ts`
  - giữ versioning + bumpVersion (phương án A)
  - bổ sung nhận event `perm_index_refresh` (hoặc mở rộng callback subscribe)

- `src/modules/core/rbac/services/rbac-permission-index.service.ts`
  - tăng TTL permission index lên 1 ngày
  - bỏ/giảm interval prewarm, chuyển sang refresh theo event + lazy-load
  - expose method để trigger refresh ngay khi nhận `perm_index_refresh`

### Enforcement

- `src/common/auth/guards/rbac.guard.ts`
  - giữ default-deny
  - đảm bảo yêu cầu `groupId` bắt buộc với route cần group (tuỳ policy của bạn)

### Group/context

- `src/common/http/middlewares/group-context.middleware.ts`
  - tối giản cache: **khuyến nghị bỏ Map cache** ở middleware, rely Redis snapshot của service
  - hoặc nếu vẫn muốn L1: chuyển Map → LRU + maxSize + negative cache

### Write paths (nơi MUST invalidate)

Bạn cần tìm và “đi dây” invalidation vào đúng service:

- `src/modules/core/rbac/services/rbac-role-assignment.service.ts` (hoặc controller/service gọi assign/sync)
- `src/modules/core/rbac/controllers/rbac.controller.ts` (đảm bảo gọi service đúng)
- module user-group membership (add/remove member) trong `src/modules/core/rbac/user-group/**` hoặc context group user module
- module role_has_permission (khi admin sửa mapping role→permission)
- module permission CRUD (nếu có)

---

## Checklist thay đổi code (chi tiết theo bước)

### Bước 0 — Chuẩn bị

- Xác nhận production dùng Redis và pub/sub hoạt động giữa các instance.
- Chốt TTL mục tiêu:
  - `RBAC_CACHE_TTL=86400` (1 ngày)
  - L1 TTL permission-set: 30–60s
  - PermissionIndex TTL: 1 ngày

### Bước 1 — Group-only trong RBAC check

Mục tiêu: 1 request chỉ check 1 scope.

- `RbacService.buildScopeCandidates()`:
  - bỏ fallback system
  - hoặc xoá hẳn function, chỉ dùng groupId.
- `RbacService.userHasPermissionsInGroup(...)`:
  - nếu `groupId` null mà vẫn đi vào RBAC: quyết định policy:
    - hoặc forbidden (yêu cầu group header)
    - hoặc allow cho một số permission public
  - giữ request-cache (`RequestContext`) cho permission-set

### Bước 2 — Chuẩn hoá “1 đường cache” cho permission-set

Mục tiêu: bỏ đường legacy, chỉ còn `getPermissions()` + `setPermissions()`.

- `RbacCacheService.hasPermission(...)` (backward-compatible):
  - đánh dấu deprecated và xoá dần các call sites.
  - đảm bảo tất cả nơi check quyền dùng `RbacService` và PermissionIndex.

### Bước 3 — Invalidation theo user+group (membership + role assignment)

Mục tiêu: near realtime khi đổi role/member.

- Khi assign/sync role:
  - sau khi DB write thành công, gọi `refreshUserPermissions(userId, groupId)` (warm cache).
  - publish invalidation message `specific_key` (đã có) để L1 các instance khác clear.

- Khi add/remove member:
  - sau DB write thành công:
    - invalidate key `rbac:v{version}:u:{user}:g:{group}`
    - nếu remove member, có thể delete key là đủ (request kế tiếp sẽ recompute hoặc trả empty sentinel).

### Bước 4 — Invalidation global (role_has_permission / permission catalog)

Mục tiêu: đơn giản + an toàn.

- Khi admin đổi role_has_permission:
  - gọi `rbacCache.bumpVersion()`
  - publish `perm_index_refresh`

- Khi admin thêm permission / đổi parent:
  - publish `perm_index_refresh`
  - nếu thay đổi có thể ảnh hưởng match logic diện rộng, cũng gọi `bumpVersion()`.

### Bước 5 — PermissionIndex: TTL dài + refresh theo event

Mục tiêu: giảm query nền mỗi instance.

- Tăng TTL lên 1 ngày.
- Thay interval prewarm bằng:
  - lazy-load lần đầu
  - refresh khi nhận `perm_index_refresh`
  - (tuỳ chọn) 1 interval rất thưa (vd 6h) như “safety net” nếu pubsub lỗi.

### Bước 6 — Tối giản group/context caching

Khuyến nghị để code đơn giản và multi-instance đúng:

- **Bỏ Map cache** trong `GroupContextMiddleware`.
- Rely vào Redis cache của `AdminGroupService.getContextSnapshot(...)`.
- Thêm negative cache ở service layer nếu cần.

Nếu bạn muốn giữ L1 tại middleware:

- đổi Map → LRU có `maxSize` (2k–5k)
- negative cache 30s cho groupId không tồn tại/inactive

### Bước 7 — TTL tuning

Sau khi invalidation đã đầy đủ:

- set `RBAC_CACHE_TTL=86400`
- theo dõi hit-rate, DB recompute rate trong 1–2 ngày

---

## Observability (đủ để vận hành)

Tối thiểu cần nhìn thấy:

- `rbac_perm_cache_hit_l1 / hit_redis / miss`
- `rbac_perm_db_recompute_count`
- latency `RbacGuard` (p95/p99)

Khuyến nghị:

- Log `[RBAC_PROFILE]` chỉ bật khi debug hoặc sampling (vd 1% request) để tránh tốn IO.

---

## Test plan (để tự tin rollout)

### Unit / integration

- **Group-only**:
  - user có quyền ở system nhưng không có ở group ⇒ phải **deny**.
  - user có quyền ở group ⇒ allow.

- **Invalidation theo user+group**:
  - assign role ⇒ request kế tiếp allow ngay.
  - remove member ⇒ request kế tiếp deny ngay.

- **Global invalidation**:
  - đổi role_has_permission ⇒ quyền mới áp dụng trên instance khác ngay (pub/sub).

### Load / performance sanity

- Cold start: request đầu có thể DB recompute 1 lần.
- Steady-state: DB recompute gần 0, check quyền < vài ms.

---

## Rollout đề xuất

1) Implement invalidation cho membership + role assignment (quan trọng nhất).
2) Add `perm_index_refresh` event + PermissionIndex refresh-by-event.
3) Switch group-only (bỏ fallback).
4) Tối giản group-context caching.
5) Tăng TTL lên 1 ngày.
6) Theo dõi metrics/logs 24–48h.

