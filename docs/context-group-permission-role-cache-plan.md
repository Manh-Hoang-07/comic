## Kế hoạch cache Context / Group / Role / Permission (TTL 1 ngày)

Tài liệu này tập trung vào **cache dữ liệu nền tảng** cho RBAC: `context`, `group`, `role`, `permission` và **các quan hệ** giữa chúng, với mục tiêu:

- **Giảm query DB** trong luồng check quyền.
- **Đơn giản hoá logic**: check quyền chỉ đọc từ Redis (và L1) thay vì chọc thẳng vào DB.
- **TTL hợp lý**: 1 ngày, nhưng vẫn **near-realtime** nhờ invalidation đúng chỗ.

---

## 1. Phạm vi & mục tiêu

- **Phạm vi**:
  - Cache danh sách:
    - Context (active).
    - Group (active) + metadata cần cho check quyền.
    - Role (active).
    - Permission (active).
  - Cache quan hệ:
    - `context` ↔ `group` (mapping group thuộc context nào).
    - `role` ↔ `context` (để validate role thuộc context, tránh query DB ở write path).
    - `role` ↔ `permission`.
    - (Tuỳ nhu cầu) `group` ↔ `role` mặc định / scope role theo context.
- **Mục tiêu**:
  - Luồng check quyền **không cần query DB** cho dữ liệu nền tảng này ở steady-state.
  - TTL Redis **1 ngày**, nhưng khi CRUD (thêm/sửa/xoá) thì:
    - **Clear / refresh đúng key** ngay sau khi DB write thành công.
    - Các instance khác sync qua Redis/pubsub.

---

## 2. Mô hình dữ liệu runtime cần cho RBAC

Để check quyền nhanh và đơn giản, ta cần 2 lớp dữ liệu:

- **Layer A – Catalog tĩnh (ít đổi)**:
  - `ContextCatalogService`: cung cấp danh sách/lookup context active từ cache.
  - `GroupCatalogService`: cung cấp danh sách/lookup group active (kèm `contextId`) từ cache.
  - `RoleCatalogService`: cung cấp danh sách/lookup role active từ cache.
  - `PermissionCatalogService`: cung cấp danh sách/lookup permission active + mapping role→permission từ cache.
  - `RoleContextCatalogService`: cung cấp mapping context→role (để validate role thuộc context) từ cache.

- **Layer B – Assignment động (đã mô tả trong RBAC v2)**:
  - `AssignedPermissionsBitmap(userId, groupId)` (blob trong Redis, TTL 1 ngày).

Tài liệu này tập trung vào **Layer A** – là input để build/refresh Layer B.

---

## 3. Thiết kế cache Layer A (Context/Group/Role/Permission)

### 3.1 Nguyên tắc chung

- **Nguồn sự thật (Source of truth)**: DB (Prisma).
- **Redis là snapshot** đọc-only trong runtime.
- **TTL Redis**: 1 ngày (`86400s`) cho toàn bộ các key catalog.
- **L1 cache (in-process)**:
  - Optional, TTL ngắn (30–60s) cho các snapshot hay dùng.
  - Chỉ nên lưu **bản snapshot JSON parse sẵn** để tránh tốn CPU parse nhiều lần.
  - Nên có thêm **index Map** (ví dụ `groupById`, `roleById`, `permByCode`) được build từ snapshot để lookup **O(1)**.

### 3.2 Đề xuất key Redis

Tên key gợi ý, có thể chỉnh cho phù hợp convention hiện tại:

Nguyên tắc thiết kế key:

- **Chọn Redis Hash làm phương án chính** để lookup nhanh theo `id/code` và tránh payload JSON `*:all` phình to.
- Các key dạng Hash sẽ được **rebuild toàn bộ** khi có thay đổi (refresh/warm sau write).

### 3.2.1 Danh sách key (Option B — chốt)

#### 1) Context catalog

- **Key (Hash)**: `rbac:ctx:by_id`
  - Field: `{contextId}`
  - Value: JSON `ContextDTO`
- **Key (Index)**: `rbac:ctx:ids`
  - Value: JSON `string[]` (list contextId active) hoặc Redis Set (tuỳ bạn)

#### 2) Group catalog

- **Key (Hash)**: `rbac:grp:by_id`
  - Field: `{groupId}`
  - Value: JSON `GroupDTO` (bao gồm `contextId`)
- **Key (Index)**: `rbac:grp:ids`
  - Value: JSON `string[]` groupId active

Tuỳ nhu cầu filter theo context:

- **Key (Hash)**: `rbac:grp:ids_by_context`
  - Field: `{contextId}`
  - Value: JSON `string[]` groupId active thuộc context

#### 3) Role catalog

- **Key (Hash)**: `rbac:role:by_id`
  - Field: `{roleId}`
  - Value: JSON `RoleDTO`
- **Key (Index)**: `rbac:role:ids`
  - Value: JSON `string[]` roleId active

#### 4) Permission catalog + hierarchy

- **Key (Hash)**: `rbac:perm:by_code`
  - Field: `{permissionCode}`
  - Value: JSON `PermissionDTO` (bao gồm `parentCode` hoặc `parentId`)
- **Key (Index)**: `rbac:perm:codes`
  - Value: JSON `string[]` permissionCode active (sorted ổn định để rebuild DenseIndex)

Khuyến nghị (để `PermissionIndex` dựng nhanh, ít parse):

- `PermissionDTO` nên dùng `parentCode` (string) thay vì `parentId` để khỏi phải resolve id→code lúc build index.

#### 5) Role → Permission mapping

- **Key (Hash)**: `rbac:role_perm:by_role`
  - Field: `{roleId}`
  - Value: JSON `string[]` permissionCode (đã lọc permission active)

#### 6) Context → Role mapping (validate role theo context)

- **Key (Hash)**: `rbac:role_ctx:by_context`
  - Field: `{contextId}`
  - Value: JSON `string[]` roleId (đã lọc role active)

### 3.2.2 TTL & refresh policy cho Hash

- **TTL**: 1 ngày cho **mọi key** thuộc catalog (`rbac:*:by_*`, `rbac:*:ids`, ...).
- **Refresh strategy**: sau mỗi write path (CRUD) → **rebuild + set lại toàn bộ key liên quan** (warm).
- Nếu cần an toàn khi deploy multi-instance:
  - Rebuild theo pattern: `SET tempKey` → `RENAME` (atomic swap) hoặc dùng prefix version `rbac:cat:v{n}:...` (nâng cao).

---

## 4. Service & nơi đặt logic cache

Mỗi domain nên có 1 service chịu trách nhiệm **đọc DB + ghi cache + invalidation**:

- **Context**:
  - `ContextCatalogService`:
    - `getAllActiveContexts()`:
      - Thứ tự: Request-cache → L1 → Redis → DB.
      - Nếu miss Redis: query DB các context active, set Redis (TTL 1 ngày), set L1.

- **Group**:
  - `GroupCatalogService`:
    - `getAllActiveGroups()`: tương tự context.
    - Có thể thêm helper:
      - `getGroupById(groupId)`:
        - Đọc từ Hash `rbac:grp:by_id`.
      - `getGroupsByContext(contextId)`:
        - Đọc `rbac:grp:ids_by_context[contextId]` (field) rồi HGET theo từng id (hoặc batch).

- **Role**:
  - `RoleCatalogService`:
    - `getAllActiveRoles()`: tương tự.

- **Permission + Role–Permission**:
  - `PermissionCatalogService`:
    - `getAllActivePermissions()`.
    - `getRolePermissionMapping()`:
      - Dùng để build `PermissionIndex` + `AssignedPermissionsBitmap`.

- **Role–Context**:
  - `RoleContextCatalogService`:
    - `getRoleIdsAllowedInContext(contextId)`: HGET `rbac:role_ctx:by_context` theo `contextId`.
    - Dùng trong write path để validate roleIds mà **không query DB**.

Các service này **không xử lý logic RBAC**, chỉ lo phần **catalog + cache**.

---

## 5. Luồng CRUD & invalidation

### 5.1 Nguyên tắc

- Mỗi khi CRUD làm thay đổi **dữ liệu nền tảng** (context, group, role, permission, role-permission), **bắt buộc**:
  - Gọi hàm invalidation/refresh tương ứng trong service catalog.
  - Việc này diễn ra **sau khi DB write thành công** (transaction commit).
- Invalidation nên làm **theo key nhỏ nhất có thể**:
  - Với catalog dạng Hash:
    - Khuyến nghị **rebuild/warm ngay** sau write (DB → Redis) để tránh request kế tiếp bị miss.
    - Nếu cần đơn giản hoá: có thể `DEL` key Hash + key index và để request sau lazy rebuild (chấp nhận spike).

Khuyến nghị triển khai:

- **Write path nên “refresh ngay”** (warm cache) để tránh spike DB ở request kế tiếp.
- Nếu thay đổi có thể ảnh hưởng rộng (đặc biệt `permission`, `role_has_permission`):
  - Đồng bộ với cơ chế sẵn có: `rbacCache.bumpVersion()` + `perm_index_refresh`.

### 5.2 Mapping vào use case cụ thể

- **Context CRUD**:
  - File/service: `ContextAdminService` (tuỳ dự án).
  - Sau khi:
    - Thêm context mới.
    - Cập nhật status (active/inactive).
    - Xoá mềm.
  - Gọi:
    - `ContextCatalogService.refreshAll()`:
      - Query DB context active.
      - Rebuild:
        - `rbac:ctx:by_id`
        - `rbac:ctx:ids`
      - Clear L1 cache.

- **Group CRUD**:
  - File: `GroupAdminService` hoặc `group-action.service.ts` (admin).
  - Sau khi:
    - Tạo group mới (thuộc context nào đó).
    - Cập nhật status.
    - Thay đổi contextId của group (nếu cho phép).
    - Xoá mềm group.
  - Gọi:
    - `GroupCatalogService.refreshAll()`.
      - Rebuild:
        - `rbac:grp:by_id`
        - `rbac:grp:ids`
        - `rbac:grp:ids_by_context`

- **Role CRUD**:
  - Sau khi:
    - Thêm mới role.
    - Đổi status.
    - Xoá mềm.
  - Gọi:
    - `RoleCatalogService.refreshAll()`.
    - `RoleContextCatalogService.refreshAll()` (nếu role-context phụ thuộc role status).

- **Permission CRUD / Role–Permission thay đổi**:
  - Sau khi:
    - Thêm mới permission.
    - Đổi parent.
    - Enable/disable permission.
    - Gán/bỏ quyền cho role (`role_has_permission`).
  - Gọi:
    - `PermissionCatalogService.refreshAll()` (Option B): rebuild `rbac:perm:by_code`, `rbac:perm:codes`, `rbac:role_perm:by_role`.
    - Đồng thời:
      - Trigger **`perm_index_refresh`** cho `PermissionIndex`.
      - Gọi `rbacCache.bumpVersion()` nếu thay đổi ảnh hưởng diện rộng (như đã mô tả trong `rbac-v2-upgrade-plan.md`).

Ghi chú (Option B):

- `PermissionCatalogService.refreshAll()` sẽ rebuild:
  - `rbac:perm:by_code`
  - `rbac:perm:codes`
  - `rbac:role_perm:by_role`

Và publish:

- `rbac:perm_index_refresh` (để `RbacPermissionIndexService` refresh ngay)
- (tuỳ case) `rbacCache.bumpVersion()` để invalidate bitmap toàn cục

- **Role–Context thay đổi** (nếu admin chỉnh role dùng được ở context nào):
  - Gọi:
    - `RoleContextCatalogService.refreshAll()` (hoặc refresh theo `contextId` nếu chia nhỏ key).
  - Không nhất thiết bump version nếu chỉ ảnh hưởng validate write path; nhưng nếu rule này ảnh hưởng “effective permissions” runtime thì nên bump version.

---

## 6. Luồng check quyền sử dụng cache mới

### 6.1 Bối cảnh

- Guard và service check quyền đã/đang chuyển sang **sử dụng Redis bitmap** (`AssignedPermissionsBitmap`).
- Tài liệu này đảm bảo phần **dữ liệu nền tảng** cũng đã ở Redis, để:
  - Khi cần recompute bitmap (cache miss) thì **không cần query DB nhiều lần**.

### 6.2 Luồng recompute permission-set (bitmap) khi cache miss

Giả sử trong `RbacService` ta có hàm:

- `recomputeUserPermissions(userId, groupId): Promise<AssignedPermissionsBitmap>`

Luồng thực hiện:

1. **Đọc catalog từ cache**:
   - `PermissionCatalogService.getAllActivePermissions()` → từ Redis Hash (`rbac:perm:by_code` + `rbac:perm:codes`).
   - `PermissionCatalogService.getRolePermissionMapping()` → từ Redis Hash (`rbac:role_perm:by_role`).
   - Nếu cần context/group:
     - `GroupCatalogService.getGroupById(groupId)` → HGET `rbac:grp:by_id` để check group active, contextId.
2. **Đọc assignment user–role–group từ DB**:
   - Bắt buộc vì đây là data động theo user:
   - Query bảng `user_role_assignment` (theo userId, groupId) để lấy **roleIds**.
3. **Kết hợp**:
   - Từ `roleIds` của user + mapping `roleId -> permissionCodes` (từ Redis).
   - Union permissionCodes (de-dup trong app).
   - Dùng `PermissionIndex` + `PermissionDenseIndex` để map sang bit index.
4. **Ghi lại Redis**:
   - Key: `rbac:v{version}:u:{userId}:g:{groupId}`.
   - Value: blob bitmap (base64).
   - TTL: 1 ngày.

Khi catalog đã cache tốt (TTL 1 ngày + invalidation đúng), bước 1 hoàn toàn không đụng đến DB.

Điểm tối ưu so với logic hiện tại:

- Hiện tại recompute đang có thể query join lớn để lấy permissionCodes trực tiếp.
- Với plan mới, DB chỉ query role assignment (nhẹ), còn role-permission mapping lấy từ Redis.

---

## 7. TTL & chính sách refresh

### 7.1 Redis TTL (Layer A)

- Tất cả key catalog:
  - `rbac:ctx:by_id`, `rbac:ctx:ids`
  - `rbac:grp:by_id`, `rbac:grp:ids`, `rbac:grp:ids_by_context`
  - `rbac:role:by_id`, `rbac:role:ids`
  - `rbac:perm:by_code`, `rbac:perm:codes`
  - `rbac:role_perm:by_role`
  - `rbac:role_ctx:by_context`
- **TTL**: 1 ngày.

Lưu ý:

- TTL dài **không gây stale** nếu:
  - Mỗi khi CRUD, ta **refresh ngay** (set lại TTL mới).
  - Không phụ thuộc vào TTL để "tự hết hạn" khi data thay đổi.

### 7.2 L1 cache

- Mỗi service catalog có thể có L1 Map/LRU:
  - TTL: 30–60s.
  - Clear khi có event refresh (nếu có).
- Không nên lưu L1 quá nhiều kiểu key lẻ tẻ; nên lưu **snapshot duy nhất** (ví dụ `ctxAll`, `grpAll`).

---

## 8. Mapping dự kiến vào code hiện tại

Tuỳ codebase hiện tại, có thể map như sau (chỉ là gợi ý, PLZ chỉnh lại theo tên thực tế):

- **Context**:
  - File: `src/modules/core/context/.../services/context.service.ts`.
  - Thêm:
    - `getAllActiveContextsWithCache()`.
    - `refreshAllContextsCache()` (dùng trong admin CRUD).

- **Group**:
  - File: `src/modules/core/context/group/admin/services/group-action.service.ts`.
  - File: `src/modules/core/context/group/user/services/group.service.ts`.
  - Thêm:
    - `getAllActiveGroupsWithCache()`.
    - `getGroupByIdFromCache(groupId)`.
    - `refreshAllGroupsCache()`.

- **Role / Permission**:
  - File: `src/modules/core/rbac/...` (service role & permission).
  - Thêm:
    - `getAllActiveRolesWithCache()`.
    - `getAllActivePermissionsWithCache()`.
    - `getRolePermissionMappingWithCache()`.
    - `refreshAllRolePermissionCache()`.

---

## 9. Checklist triển khai

- **Bước 1**: Tạo các service catalog (hoặc mở rộng service hiện tại) với:
  - API `get*WithCache()` (đọc: Request-cache → L1 → Redis → DB).
  - API `refresh*Cache()` (chỉ dùng ở write path).
- **Bước 2**: Cắm `refresh*Cache()` vào:
  - Context admin CRUD.
  - Group admin CRUD.
  - Role admin CRUD.
  - Permission / Role–Permission admin CRUD.
- **Bước 2.1**: Bổ sung `RoleContextCatalogService` và cắm vào nơi validate role theo context (write path).
- **Bước 3**: Cập nhật `RbacService` recompute bitmap để:
  - Luôn dùng catalog từ Redis (thông qua các service mới).
  - DB chỉ query `user_role_assignment` (roleIds), tránh join lớn lấy permissionCodes.
- **Bước 4**: Thêm metric/log cơ bản:
  - `ctx_cache_hit_redis / miss`.
  - `grp_cache_hit_redis / miss`.
  - `rbac_perm_catalog_hit_redis / miss`.
- **Bước 5**: Sau khi vận hành ổn:
  - Có thể tăng TTL lên >1 ngày nếu invalidation chuẩn.

---

## 10. Ghi chú

- Nếu sau này cần **multi-tenant / multi-instance**, kiến trúc này vẫn ổn vì:
  - Redis là shared giữa các instance.
  - Invalidation thông qua `refresh*Cache()` là đủ (không cần pubsub nếu chỉ viết/đọc qua cùng Redis).
- Nếu cần **event-driven** hơn:
  - Có thể phát thêm event (`context_catalog_refresh`, `group_catalog_refresh`, ...) để:
    - Các instance khác clear L1 nhanh hơn.
  - Tuy nhiên đây là bước nâng cao, không bắt buộc trong phase đầu.

