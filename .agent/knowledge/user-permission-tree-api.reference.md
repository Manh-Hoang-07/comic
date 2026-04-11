# Tham khảo & tích hợp FE: cây gán **role** theo group cho user

Tài liệu này dùng cho **FE tích hợp** và team **BE tham chiếu** khi implement. Quyền hiệu lực trong hệ thống đi qua **role** (gán role trong từng group → union permission), nên đường dẫn API được đặt dưới namespace **`/admin/users/.../roles/...`**, tránh nhầm với catalog permission thuần (`permission.manage`).

**Lưu ý:** Một số endpoint có thể chưa được triển khai trong code — ký hiệu **(kế hoạch)**. Endpoint **đã có** trong repo được đánh dấu rõ. Prefix global (ví dụ `api`) tùy cấu hình app — dưới đây gọi là `{API_PREFIX}`.

---

## 1. Cho FE: tổng quan gọi API

### 1.1. Base URL & prefix

| Thành phần | Giá trị / ghi chú |
|------------|-------------------|
| Base | `{ORIGIN}/{API_PREFIX}` — ví dụ `https://domain.com/api` |
| Namespace admin user | `/admin/users` |
| **Đường dẫn đặt theo role** | Màn hình gán quyền = gán **role** trong group → dùng `/users/:userId/roles/...` (xem bảng dưới). |

### 1.2. Auth & context (bắt buộc đọc)

| Header / cơ chế | Ý nghĩa |
|-----------------|--------|
| `Authorization: Bearer <access_token>` | JWT như các API admin khác. |
| `X-Group-Id` (hoặc tên header context group mà BE đang dùng) | Khi đăng nhập **group admin** (không phải system): thường bắt buộc để xác định nhóm đang thao tác. **System admin** có thể bỏ qua hoặc dùng kèm query/body tùy API — **xác nhận lại với BE** sau khi implement. |

**Hành vi nghiệp vụ:** User **group context** chỉ được chỉnh assignment cho user **thuộc cùng group** (policy phía BE). Payload không được chứa `group_id` khác group đang chọn — nếu gửi, BE trả `403`.

### 1.3. Quy ước tên field (JSON)

- Repo backend hiện **thường dùng `snake_case`** cho response một số API user/RBAC (`group_id`, `role_id`, …).
- Nếu team thống nhất **camelCase** cho toàn bộ client, cần **một pass** map ở BE (serializer) hoặc ở FE — **thống nhất một nguồn** trước khi ship.  
- Tài liệu dưới đây mô tả **cả hai** ở chỗ dễ nhầm: ví dụ chính dùng **snake_case** (khớp hướng hiện tại); FE có thể map sang camelCase khi hiển thị.

---

## 2. Bảng endpoint (cho FE)

| STT | Mục đích | Method | Path | Trạng thái |
|-----|----------|--------|------|------------|
| A | Load **cây group → role** (đủ role được chọn + trạng thái tick) | `GET` | `{API_PREFIX}/admin/users/:userId/roles/tree` | **(kế hoạch)** |
| B | Lưu **bulk** nhiều group trong một request | `PUT` hoặc `POST` | `{API_PREFIX}/admin/users/:userId/roles/batch` | **(kế hoạch)** — tên cuối có thể là `batch` hoặc `sync` (tránh trùng với mục C). |
| C | Sync role trong **một** group (đã có) | `PUT` | `{API_PREFIX}/admin/users/:userId/roles` | **Đã có** |
| D | Chỉ xem role **đã gán** (không có full catalog theo group) | `GET` | `{API_PREFIX}/admin/users/:userId/roles` | **Đã có** |

**Thứ tự route phía BE:** Các path cụ thể (`roles/tree`, `roles/batch`) phải khai báo **trước** route generic `GET|PUT :userId/roles` nếu cùng controller để tránh `:id` nuốt nhầm từ `tree`/`batch`.

---

## 3. Chi tiết contract (gửi FE)

### 3.1. `GET /admin/users/:userId/roles/tree` **(kế hoạch)**

**Mục đích:** Một request duy nhất để vẽ màn hình checkbox: mỗi **group** có danh sách **role** được phép trong context của group đó, kèm trạng thái user đã được gán hay chưa; group có thể full chọn / một phần (indeterminate).

**Response 200 — mảng object (ví dụ `snake_case`):**

```json
[
  {
    "group_id": 1,
    "group_name": "Sales",
    "checked": true,
    "indeterminate": false,
    "roles": [
      { "role_id": 11, "role_name": "View Orders", "checked": true },
      { "role_id": 12, "role_name": "Edit Orders", "checked": false }
    ]
  },
  {
    "group_id": 2,
    "group_name": "CSKH",
    "checked": false,
    "indeterminate": true,
    "roles": [
      { "role_id": 21, "role_name": "View Customer", "checked": true },
      { "role_id": 22, "role_name": "Reply Customer", "checked": false }
    ]
  }
]
```

| Field | Kiểu | Ý nghĩa (FE) |
|-------|------|----------------|
| `group_id` | number | Id nhóm (shop / organizational group). |
| `group_name` | string | Nhãn hiển thị cột nhóm. |
| `checked` | boolean | `true` khi **mọi** role trong group đều được chọn. |
| `indeterminate` | boolean | `true` khi có ít nhất một role được chọn nhưng **không phải tất cả** (checkbox group kiểu Ant Design). |
| `roles` | array | Danh sách role **có thể gán** trong group (catalog theo context), không chỉ role đã gán. |
| `roles[].role_id` | number | Id role. |
| `role_name` | string | Tên hiển thị (có thể bổ sung `role_code` nếu BE trả thêm — tùy contract cuối). |
| `roles[].checked` | boolean | Role này đã được gán cho user trong group tương ứng. |

**Ghi chú FE:**

- Có thể **bỏ qua** `checked` / `indeterminate` ở group và **tự tính** từ `roles[].checked` nếu BE không gửi — nhưng nếu BE gửi sẵn thì giữ đồng nhất UI.
- Thứ tự group/role: nếu cần sort cố định, yêu cầu BE sort theo `sort_order` hoặc tên — **ghi rõ trong ticket**.

**Lỗi thường gặp:**

| HTTP | Ý nghĩa gợi ý |
|------|----------------|
| `401` | Token hết hạn / không hợp lệ. |
| `403` | Không được xem/sửa user này (sai group / policy). |
| `404` | `userId` không tồn tại. |

---

### 3.2. `PUT` hoặc `POST /admin/users/:userId/roles/batch` **(kế hoạch)**

**Mục đích:** Submit một lần: **đồng bộ** role theo **nhiều group**. Semantics: với mỗi phần tử trong body, **thay thế toàn bộ** role của user trong `group_id` đó bằng `role_ids` (cùng tinh thần “xóa cũ trong group + gán lại” — khớp `syncRolesInGroup` phía BE).

**Request body:** **mảng JSON ở gốc** (không bọc thêm object `groups` — mỗi phần tử là một nhóm cần cập nhật).

```json
[
  { "group_id": 1, "role_ids": [11] },
  { "group_id": 2, "role_ids": [21, 22] }
]
```

| Field (mỗi phần tử) | Kiểu | Bắt buộc | Ý nghĩa |
|---------------------|------|----------|---------|
| `group_id` | number | Có | Id group cần sync. |
| `role_ids` | number[] | Có | Có thể là `[]` = **gỡ hết role** trong group đó (hành vi chi tiết membership `user_groups` — **xác nhận với BE**). |

**Response 200/204:** Có thể trả `{ "success": true }` hoặc body rỗng — thống nhất với các API update khác của dự án.

**Lỗi:**

| HTTP | Ý nghĩa gợi ý |
|------|----------------|
| `400` | `role_id` không thuộc context của `group_id`; hoặc schema sai. |
| `403` | Group admin gửi `group_id` không thuộc quyền. |

Sau khi lưu thành công, session/permission của user có thể cần **refresh token** hoặc **gọi lại** API user/profile nếu cùng user đang đăng nhập — tùy cách BE xử lý cache RBAC.

---

### 3.3. API đã có — không trùng với `tree` / `batch`

#### `GET /admin/users/:userId/roles`

- Query optional: `groupIds` (chuỗi id phân tách — đối chiếu code hiện tại).
- Trả về role **đã gán**, gom theo group; **không** thay thế `roles/tree` nếu FE cần full catalog role theo từng group.

#### `PUT /admin/users/:userId/roles`

- Body: `{ "role_ids": [...], "group_id": <optional> }` — sync **một** group.
- `group_id` có thể lấy từ body hoặc context (`X-Group-Id`) tùy BE — **đọc Swagger thực tế** khi tích hợp màn hình chỉ sửa một nhóm.

**FE:** Ưu tiên dùng **`roles/tree` + `roles/batch`** cho màn hình tổng; chỉ dùng `PUT .../roles` khi luồng chỉnh từng group đơn lẻ.

**Ghi chú:** Không bổ sung API riêng “resolve permission từ `role_ids`” — union mã quyền là việc **nội bộ BE** khi áp RBAC (`PermissionCatalogService` / cache), FE chỉ cần tree + batch.

---

## 4. So sánh nhanh: path cũ (ý tưởng ban đầu) vs path chuẩn đề xuất

| Ý tưởng cũ (tham khảo) | Đề xuất dùng với FE / BE |
|------------------------|---------------------------|
| `GET .../permission-tree` | `GET .../users/:id/roles/tree` |
| `POST .../users/:id/permissions` (body có object `groups`) | `PUT` hoặc `POST .../users/:id/roles/batch` với body là **mảng** `[{ "group_id", "role_ids" }, ...]` |

---

## 5. Hiện trạng codebase (BE)

- Bảng: **`user_role_assignments`** (`user_id`, `role_id`, `group_id`).
- Đồng bộ một group: `RbacService.syncRolesInGroup` ← `PUT .../users/:id/roles`.
- Catalog role theo context group: `RoleContextCatalogService` (dùng khi build `roles/tree`).
- Union permission từ role ids: `PermissionCatalogService.getPermissionCodesForRoleIds` — **chỉ nội bộ BE** khi tính quyền hiệu lực / cache RBAC, không bắt buộc expose HTTP cho FE.

---

## 6. Kế hoạch triển khai BE (theo `.agent`)

### 6.1. Việc cần làm

1. **DTO** cho `roles/tree` response và `roles/batch` body: **mảng** phần tử `{ group_id, role_ids }` (validate từng phần tử).
2. **Service** (ActionService hoặc tương đương): merge catalog role theo group + assignment hiện tại; tính `checked` / `indeterminate` nếu trả từ BE.
3. **`roles/batch`:** lặp `syncRolesInGroup` trong transaction hoặc một method repository mới + invalidate cache RBAC đúng scope.
4. **Controller:** Đăng ký route **`roles/tree`** và **`roles/batch` trước** route `/:id/roles` generic (nếu cùng file).
5. **`@Permission` + `PolicyService.assertAccess` / `roleScope`** giống `getUserRoles`.
6. **Test** unit/integration.

### 6.2. Ưu tiên

| Mức | Hạng mục |
|-----|----------|
| P0 | `GET .../roles/tree` + policy |
| P0 | `PUT/POST .../roles/batch` (body mảng `[{ group_id, role_ids }]`) |
| P1 | OpenAPI/Swagger + thống nhất snake_case vs camelCase với FE |

### 6.3. Có xóa API cũ không?

- **Không xóa** `GET/PUT .../users/:id/roles` trong giai đoạn đầu; có thể **deprecated** sau khi FE chuyển hết.
- **Không xóa** service/repository lõi — API mới chỉ là lớp tổ hợp.

---

## 7. Kết luận

- Đường dẫn **gắn với `roles`** (`…/users/:userId/roles/tree`, `…/roles/batch`); không thêm API HTTP “effective permission” — FE không cần.
- Body **batch** là **mảng** các `{ group_id, role_ids }`, không bọc object `groups`.
- Tài liệu đủ để **FE mock / tích hợp**; phần **(kế hoạch)** đối chiếu Swagger sau khi BE merge.

*Bản cập nhật: đường dẫn role-centric, contract cho FE, kế hoạch BE — khi deploy production kiểm tra lại `API_PREFIX` và tên header context group.*
