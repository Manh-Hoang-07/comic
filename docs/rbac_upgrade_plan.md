# KẾ HOẠCH NÂNG CẤP TOÀN DIỆN HỆ THỐNG RBAC & QUẢN LÝ USER

Tài liệu này hướng dẫn chi tiết các bước Refactor Code và Dữ liệu để đạt tiêu chuẩn Phân quyền Đa ngữ cảnh, Chi tiết hóa (Granular) và Master Key.

---

## I. MỤC TIÊU THAY ĐỔI
1. **Tách biệt 100%:** Cập nhật Profile (Họ tên, Email...) và Quản lý Quyền (Roles) dùng 2 API khác nhau.
2. **Chi tiết hóa (Granularity):** Quyền được chia nhỏ (View, Create, Update, Delete, Status).
3. **Cơ chế Master Key (Global Fallback):** Super Admin chỉ cần gán quyền tại `System Group` là có quyền trên TOÀN BỘ các Group khác.

---

## II. CHI TIẾT CÁC FILE CẦN CẬP NHẬT (TODO LIST)

### 1. Module: USER (src/modules/core/user)
Tập trung vào quản lý Thông tin cá nhân (Profile).

- **Tệp `user.service.ts`:**
  - [ ] **Sửa hàm `transform`**: Xóa toàn bộ logic lọc và gán `u.role_ids`. Trả về User sạch, không kèm roles để tăng hiệu năng Query.
- **Tệp `user-action.service.ts`:**
  - [ ] **Sửa hàm `syncRelations`**: 
    - XÓA BỎ đoạn gọi `this.rbacService.syncRolesInGroup`.
    - CHỈ GIỮ LẠI `this.userRepo.upsertProfile`.
- **Tệp `user.controller.ts` & DTOs:**
  - [ ] Gỡ bỏ field `role_ids` và `group_id` khỏi API Create/Update User.

### 2. Module: RBAC (src/modules/core/rbac)
Trung tâm xử lý mọi quyền truy cập và ngữ cảnh.

- **Tệp `rbac.controller.ts` (API: PUT `:id/roles`):**
  - [ ] Nhận `group_id` trực tiếp từ Request Body (Dành cho Super Admin chuyển Group).
  - [ ] Nếu Body rỗng, lấy `groupId` từ `RequestContext` (x-group-id header).
  - [ ] Kiểm tra `isSystemAdmin` để gán `skipValidation = true` khi gọi Service.
- **Tệp `rbac.service.ts`:**
  - [ ] **Hàm `syncRolesInGroup`**: Đảm bảo dùng `$transaction` để Xóa (DeleteMany) và Tạo (CreateMany) Role.
  - [ ] Đảm bảo gọi `refreshUserPermissions` để Clear Cache sau mỗi lượt gán.
- **Tầng Security/Guard (Hoặc `RbacService.hasPermission`):**
  - [ ] **Cập nhật Logic Check quyền 2 lớp**:
    ```typescript
    // Logic chuẩn:
    HAS_PERMISSION = (Quyền P tại Group X) OR (Quyền P tại System Group)
    ```

---

## III. THAY ĐỔI DỮ LIỆU (DATA ASSIGNMENTS)

**LƯU Ý:** Không thay đổi Schema Database. Chỉ thay đổi Dữ liệu Seed.

1. **Permission Table:** Seed lại toàn bộ mã quyền chi tiết (VD: `ROLE:VIEW`, `USER:STATUS`, `COMIC:APPROVE`...). Danh sách chi tiết xem tại `rbac_definitions.md`.
2. **RoleHasPermission Table:** Phân bổ các mã quyền con mới này vào các Role mẫu (`super_admin`, `group_owner`, `group_editor`).
3. **Context Table:** Đảm bảo có ít nhất 2 Context Code: `system` và `group`.

---

## IV. QUY TRÌNH VẬN HÀNH (WORKFLOW)

### 1. Luồng Super Admin (Toàn quyền)
- **Hành động:** Chuyển User từ Group A sang Group B.
- **API Call:** `PUT /admin/users/:id/roles` 
  - Body: `{ "group_id": "Group_B", "role_ids": [New_Roles] }`.
- **Kết quả:** Code tự động xóa Role cũ tại Group A (nếu cần) hoặc chỉ đơn giản là gán thêm vào Group B.

### 2. Luồng Group Admin (Nội bộ)
- **Hành động:** Gán quyền cho Nhân viên mới.
- **API Call:** `PUT /admin/users/:id/roles`
  - Header: `x-group-id: current_group`.
  - Body: `{ "role_ids": [Role_IDs] }`.
- **Kết quả:** Hệ thống tự động gán quyền vào Group hiện tại, có validation context để đảm bảo an toàn.

---

## V. HIỂN THỊ MENU & NÚT BẤM (UI/UX)
Frontend sẽ dựa vào mã Quyền chi tiết để xử lý giao diện:
- Nếu User không có `USER:STATUS` -> **Ẩn** nút Switch Khóa/Mở tài khoản.
- Nếu User không có `CONFIG:UPDATE` -> **Ẩn** Menu Cấu hình hệ thống.
- Nếu User là Group Editor -> **Chỉ hiện** các tác vụ liên quan đến dữ liệu của họ.
