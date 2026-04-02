# CHI TIẾT DANH MỤC PHÂN QUYỀN (CORE PERMISSIONS DEFINITION)

Bản danh mục này đồng bộ 100% với tệp hằng số `rbac.constants.ts`. Dùng để thiết kế Menu và nút chức năng (UI/UX).

---

## 1. CẤU TRÚC NGỮ CẢNH (CONTEXTS)
- `system`: Quản trị toàn bộ sàn (Master Dashboard).
- `group`: Quản trị nội bộ Nhóm/Đơn vị (Group Dashboard).

---

## 2. CHI TIẾT QUYỀN HẠN CORE (MODULE: CORE)

### 2.1. Module: IAM & RBAC (Quản lý Quyền)
| Mã Quyền (Permission Code) | Mô tả hành động | Menu / Nút UI |
| :--- | :--- | :--- |
| `role.view` | Xem danh sách vai trò | Menu: Quản lý Vai trò |
| `role.create` | Tạo vai trò mới | Nút: Thêm Vai trò |
| `role.update` | Sửa thông tin vai trò | Nút: Sửa |
| `role.delete` | Xóa vai trò | Nút: Xóa |
| `permission.view` | Xem danh mục quyền | Menu: Danh mục quyền |
| `permission.sync` | Đồng bộ quyền từ code | Nút: Sync Permissions |
| `assignment.view` | Xem danh sách cấp quyền | Menu: Phân quyền User |
| `assignment.manage` | Thực hiện gán Role cho User | Nút: Cấp quyền |

### 2.2. Module: USER (Quản lý Tài khoản)
| Mã Quyền (Permission Code) | Mô tả hành động | Menu / Nút UI |
| :--- | :--- | :--- |
| `user.view` | Xem danh sách người dùng | Menu: Quản lý User |
| `user.create` | Tạo tài khoản quản trị | Nút: Thêm User |
| `user.update` | Sửa thông tin cơ bản | Nút: Sửa User |
| `user.delete` | Xóa tài khoản | Nút: Xóa User |
| `user.status` | Khóa/Mở khóa tài khoản | Switch: Trạng thái |
| `profile.view` | Xem hồ sơ chi tiết | Trang cá nhân |
| `profile.update` | Sửa hồ sơ cá nhân | Nút: Lưu hồ sơ |

### 2.3. Module: SYSTEM-CONFIG (Cấu hình)
| Mã Quyền (Permission Code) | Mô tả hành động | Menu / Nút UI |
| :--- | :--- | :--- |
| `system.manage` | Quyền tối cao (Super Admin) | Toàn quyền thao tác |
| `system.config.view` | Xem cấu hình website | Menu: Cấu hình chung |
| `system.config.update` | Lưu cấu hình website | Nút: Lưu thay đổi |
| `system.banner.manage` | Quản lý banner quảng cáo | Menu: Banner/Ads |
| `notification.view` | Xem lịch sử thông báo | Quản lý Thông báo |
| `notification.send` | Gửi thông báo hệ thống | Nút: Gửi thông báo |

### 2.4. Module: NAVIGATION (Menu & Địa lý)
| Mã Quyền (Permission Code) | Mô tả hành động | Menu / Nút UI |
| :--- | :--- | :--- |
| `menu.view` | Xem cấu hình Menu | Quản lý Menu |
| `menu.manage` | Thêm/Sửa/Xóa Menu item | Các nút CRUD Menu |
| `location.view` | Xem danh mục địa lý | Danh mục Địa danh |
| `location.manage` | Quản lý Quốc gia/Tỉnh/Xã | Các nút CRUD địa lý |

---

## 3. CHI TIẾT QUYỀN HẠN NỘI DUNG (MODULE: CONTENT)

| Mã Quyền (Permission Code) | Mô tả hành động | Phạm vi (Scope) |
| :--- | :--- | :--- |
| `comic.view` | Xem danh sách truyện | All / Group |
| `comic.create` | Tạo truyện mới | All / Group |
| `comic.update` | Sửa thông tin truyện | All / Group |
| `comic.delete` | Xóa truyện | All / Group |
| `comic.approve` | Phê duyệt truyện lên sàn | Chỉ Super Admin |
| `chapter.view` | Xem danh sách chương | All / Group |
| `chapter.create` | Đăng chương mới | All / Group |
| `chapter.update` | Sửa nội dung chương | All / Group |
| `chapter.delete` | Xóa chương truyện | All / Group |

---

## 4. MA TRẬN VAI TRÒ MẪU (ROLE-PERMISSION MATRIX)

| Vai trò | Ngữ cảnh | Danh sách Quyền hạn tiêu biểu |
| :--- | :---: | :--- |
| `super_admin` | `system` | `system.manage`, `*:*` |
| `group_owner` | `group` | `comic.*`, `chapter.*`, `user.*` (trung group) |
| `group_editor` | `group` | `comic.create`, `comic.update`, `chapter.create` |
| `group_uploader` | `group` | `chapter.create`, `chapter.update` |
