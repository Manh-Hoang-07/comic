# API gán vai trò (role) theo group — hướng dẫn tích hợp FE

Tài liệu mô tả các endpoint dùng cho **màn hình gán role cho user trong từng group** (namespace `admin/users/.../roles`).  
Prefix HTTP mặc định của app: `api` (cấu hình `GLOBAL_PREFIX` / `app.globalPrefix`). Đường dẫn đầy đủ thường là:

`https://{domain}/{GLOBAL_PREFIX}/admin/users/...`

Ví dụ local: `http://localhost:{port}/api/admin/users/...`

---

## 1. Xác thực & ngữ cảnh group

| Thành phần | Bắt buộc | Mô tả |
|------------|----------|--------|
| `Authorization: Bearer <access_token>` | Có | JWT giống các API admin khác. |
| `X-Group-Id: <id>` hoặc `group-id: <id>` | Tùy ngữ cảnh | Khi đăng nhập **group admin** (không phải system): BE đọc header này để biết group đang thao tác. **System admin** thường không bắt buộc; có thể kèm `groupIds` query (xem từng API). |

**Lưu ý nghiệp vụ:** User group context chỉ được thao tác user **thuộc cùng group** (policy BE). Batch: mỗi `group_id` trong body phải trùng group context (không được gửi group khác) — nếu sai → `403`.

---

## 2. Quyền (permission) theo endpoint

| Endpoint | Permission (code) |
|----------|-------------------|
| `GET .../roles`, `GET .../roles/tree` | `user.view` |
| `PUT .../roles/batch`, `PUT .../roles` | `assignment.manage` |

Nếu thiếu quyền, BE trả `403` (tùy cấu hình guard).

---

## 3. Kiểu dữ liệu & tên field

- Response/JSON hiện **snake_case** (`group_id`, `role_id`, `role_name`, …). FE có thể map sang camelCase ở layer adapter nếu cần.
- `id` user / group / role: BE có thể trả **number** hoặc **string** tùy serializer/DB; FE nên xử lý linh hoạt (hoặc chuẩn hóa một kiểu sau khi nhận).

---

## 4. `GET /admin/users/:userId/roles/tree`

**Mục đích:** Một request để vẽ UI checkbox: mỗi **group** có danh sách **role được phép gán** trong context của group đó, kèm trạng thái đã gán; có `checked` / `indeterminate` ở cấp group (Ant Design Tree/Checkbox).

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/admin/users/:userId/roles/tree` |
| **Query** | `groupIds` *(optional)* — chuỗi id group cách nhau bằng dấu phẩy, ví dụ `1,2,3`. **System:** có thể dùng để giới hạn nhóm hiển thị. **Group context:** chỉ group hiện tại có hiệu lực (query không khớp → có thể rỗng). |
| **Permission** | `user.view` |

### Response `200`

Mảng object (thứ tự group/role có thể sort theo id hoặc tên — không bảo đảm sort cố định nếu chưa yêu cầu BE).

```json
[
  {
    "group_id": 1,
    "group_name": "Sales",
    "checked": false,
    "indeterminate": true,
    "roles": [
      { "role_id": 11, "role_name": "View Orders", "checked": true },
      { "role_id": 12, "role_name": "Edit Orders", "checked": false }
    ]
  }
]
```

| Field | Ý nghĩa |
|-------|--------|
| `group_id` | Id nhóm. |
| `group_name` | Tên hiển thị nhóm. |
| `checked` | `true` khi **tất cả** role trong group đều được chọn. |
| `indeterminate` | `true` khi có ít nhất một role được chọn nhưng không phải tất cả. |
| `roles` | Catalog role **có thể gán** trong group (không chỉ role đã gán). |
| `roles[].role_id` | Id role. |
| `roles[].role_name` | Tên hiển thị (có thể `null`). |
| `roles[].checked` | Role đã gán cho user trong group đó. |

**Lỗi thường gặp**

| HTTP | Gợi ý |
|------|--------|
| `401` | Token hết hạn / không hợp lệ. |
| `403` | Không được xem user này hoặc sai group context. |
| `404` | `userId` không tồn tại. |

**Gợi ý FE:** Có thể tự tính lại `checked` / `indeterminate` từ `roles[].checked` nếu cần; nếu BE đã gửi thì dùng luôn cho đồng nhất.

---

## 5. `PUT /admin/users/:userId/roles/batch`

**Mục đích:** Lưu **một lần** đồng bộ role theo **nhiều group**. Với mỗi phần tử: **thay thế toàn bộ** role của user trong `group_id` đó bằng `role_ids` (xóa assignment cũ trong group + gán lại).

| | |
|--|--|
| **Method** | `PUT` |
| **Path** | `/admin/users/:userId/roles/batch` |
| **Content-Type** | `application/json` |
| **Permission** | `assignment.manage` |

### Body

**Mảng JSON ở gốc** (không bọc object `groups`):

```json
[
  { "group_id": 1, "role_ids": [11, 12] },
  { "group_id": 2, "role_ids": [21] }
]
```

| Field (mỗi phần tử) | Bắt buộc | Ý nghĩa |
|---------------------|----------|--------|
| `group_id` | Có | Id group cần sync. |
| `role_ids` | Có (mảng) | `[]` = **gỡ hết role** trong group đó (vẫn giữ membership group tùy logic BE khi còn role khác — đã sync rỗng trong group). |

Nếu **trùng `group_id`** trong mảng, phần tử **xuất hiện sau** được áp dụng (ghi đè).

### Response `200`

```json
{ "success": true }
```

**Lỗi**

| HTTP | Gợi ý |
|------|--------|
| `400` | Body không phải mảng; thiếu `group_id` / `role_ids`; `role_id` không thuộc context của group. |
| `403` | Group admin gửi `group_id` không khớp context; hoặc không được sửa user. |
| `404` | User không tồn tại. |

**Sau khi lưu:** Nếu đang sửa chính user đang đăng nhập, có thể cần **refresh token** hoặc gọi lại API profile / permission — tùy chính sách cache RBAC phía BE.

---

## 6. `GET /admin/users/:userId/roles` *(tùy chọn — danh sách đã gán)*

**Mục đích:** Chỉ lấy **role đã gán**, gom theo group — **không** có full catalog như `roles/tree`. Nhẹ hơn, dùng cho badge, tóm tắt, màn không cần checkbox đầy đủ.

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/admin/users/:userId/roles` |
| **Query** | `groupIds` *(optional)* — tương tự tree. |
| **Permission** | `user.view` |

### Response `200` (ví dụ)

```json
[
  {
    "group_id": 1,
    "group_code": "sales",
    "group_name": "Sales",
    "roles": [
      { "role_id": 11, "role_code": "view_orders", "role_name": "View Orders" }
    ]
  }
]
```

---

## 7. `PUT /admin/users/:userId/roles` *(một group — đã có sẵn)*

**Mục đích:** Đồng bộ role trong **một** group (cùng semantics “thay thế toàn bộ” trong group đó).

| | |
|--|--|
| **Method** | `PUT` |
| **Path** | `/admin/users/:userId/roles` |
| **Permission** | `assignment.manage` |

### Body

```json
{
  "role_ids": [11, 12],
  "group_id": 1
}
```

| Field | Bắt buộc | Mô tả |
|-------|----------|--------|
| `role_ids` | Khuyến nghị | Mảng id role; bỏ qua hoặc `[]` = xóa hết role trong group. |
| `group_id` | Tùy | **System admin:** nên gửi để chọn group. **Group admin:** có thể bỏ — BE lấy từ `X-Group-Id` / context; nếu thiếu cả hai → `400` với message yêu cầu `group_id` hoặc header. |

---

## 8. Gợi ý luồng UI (màn gán role tổng)

1. Mở màn hình: `GET .../users/{userId}/roles/tree` (+ `groupIds` nếu system cần lọc).
2. User chỉnh checkbox theo group/role.
3. Submit: `PUT .../users/{userId}/roles/batch` với mảng `{ group_id, role_ids }` phản ánh trạng thái cuối (chỉ cần gửi các group đã thay đổi nếu FE tối ưu; gửi đủ các group màn hình đang quản lý cũng được).
4. **Hoặc** chỉnh từng group: `PUT .../users/{userId}/roles` với một `group_id` + `role_ids`.

---

## 9. Swagger

Nếu BE bật Swagger: `{GLOBAL_PREFIX}/docs` (ví dụ `/api/docs`) — tag **Admin / User Management** chứa các route trên.

---

*Tài liệu căn theo code hiện tại (`UserController`, `RbacController`, `UserRolesService`). Khi deploy production, xác nhận lại `GLOBAL_PREFIX` và header group với team BE.*
