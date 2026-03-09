# Kế hoạch nâng cấp hệ thống Phân quyền (RBAC) - Project Comic

Dựa trên phân tích cấu trúc Database (`schema.prisma`) và logic thực thi hiện tại trong `RbacService`, dưới đây là kế hoạch chi tiết để nâng cấp hệ thống phân quyền lên tiêu chuẩn chuyên nghiệp, đảm bảo tính bảo mật, hiệu suất và khả năng mở rộng.

---

## 1. Ưu tiên 1: Chuẩn hóa & An toàn (Clean Logic)

### 🚩 Chuyển đổi "System ID" sang "System Type/Code"
*   **Hiện trạng:** Nhiều nơi đang check `groupId === 1` hoặc logic quản trị hệ thống bị phân tán.
*   **Hành động:** 
    *   Định nghĩa hằng số `CONTEXT_TYPE.SYSTEM = 'system'` trong `rbac.constants.ts`.
    *   Cập nhật `checkSystemPermissions` để tìm kiếm `Context` dựa trên `type` thay vì ID ảo.
*   **Lợi ích:** Hệ thống không bị sập khi Migrate sang Database mới với ID khác.

### 🚩 Áp dụng Database Transaction cho các thao tác Sync
*   **Hiện trạng:** Hàm `syncRolesInGroup` đã bắt đầu dùng `$transaction` nhưng cần đảm bảo tất cả các Repository liên quan đều hỗ trợ Transaction context.
*   **Hành động:** Đảm bảo các hàm `deleteMany` và `createMany` trong Repository nhận vào tham số `tx` (Prisma Client Transaction).

---

## 2. Ưu tiên 2: Hiệu năng & Tối ưu (Performance)

### 🚀 Nâng cấp cơ chế Cache Permission (Flattening)
*   **Hiện trạng:** `collectPermissionCodes` đang thực hiện đệ quy mỗi khi "Cache Miss". Việc đệ quy ngược lên cha `include: { parent: { include: { parent... } } }` bị giới hạn cấp độ.
*   **Hành động:** 
    *   **Flattening on Cache:** Khi lưu vào Redis, lưu một mảng phẳng (Set) chứa cả quyền trực tiếp và tất cả quyền cha.
    *   **Trigger Update:** Khi một Permission hoặc Role thay đổi cấu trúc cây, thực hiện "Invalidate" hoặc tính toán lại Cache cho các User liên quan.
*   **Lợi ích:** Interceptor check quyền chỉ tốn O(1) trên Redis, không bao giờ phải lo về độ sâu của cây quyền.

### 🚀 Tối ưu hóa Interceptor & Guard
*   **Hiện trạng:** Interceptor có thể đang query DB trên mọi request.
*   **Hành động:** 
    *   Sử dụng `RbacCacheService` triệt để trong `PermissionsGuard`.
    *   Chỉ thực hiện tính toán quyền nặng nề 1 lần duy nhất khi User đăng nhập hoặc thay đổi Group (Switch Workspace).

---

## 3. Ưu tiên 3: Quản lý & Bảo trì (Maintainability)

### 🧹 Loại bỏ String Literals (Type-Safety)
*   **Hành động:** Thay thế toàn bộ các chuỗi cứng `'system.manage'`, `'group.member.view'` bằng một Object tập trung hoặc Enum.
    ```typescript
    export const PERM = {
      SYSTEM: { MANAGE: 'system.manage' },
      GROUP: { MEMBER_VIEW: 'group.member.view' }
    }
    ```
*   **Lợi ích:** Tránh lỗi đánh máy (Typo) và dễ dàng tìm kiếm (Find Usages).

### 🧹 Giải quyết triệt để lỗi N+1 Query
*   **Hành động:** Rà soát `UserGroupService` và `RbacService`. Thay thế các vòng lặp `map` + `await` bằng `findMany({ where: { id: { in: ids } } })`.

---

## 4. Ưu tiên 4: Bảo mật (Security)

### 🔒 Đồng bộ hóa JWT và Context
*   **Hành động:** Đảm bảo `groupId` lấy từ Header phải được xác thực chéo với danh sách `user_groups` mà User thực sự tham gia (đã có logic check nhưng cần làm nghiêm ngặt hơn ở tầng Guard).

---

## 📅 Lộ trình thực hiện (Roadmap)

1.  **Giai đoạn 1 (Ngày 1):** Fix Hardcoded IDs & Chuẩn hóa Constants.
2.  **Giai đoạn 2 (Ngày 2):** Cấu trúc lại cơ chế Flatten Permission Tree & Cache Redis.
3.  **Giai đoạn 3 (Ngày 3):** Refactor Repositories hỗ trợ Transaction & Fix N+1 Query.
4.  **Giai đoạn 4 (Ngày 4):** Kiểm thử (Unit Test) cho các Case phân quyền phức tạp (Multi-tenant).

> [!TIP]
> Bạn nên bắt đầu từ việc chuẩn hóa **Constants** trước vì nó là ít rủi ro nhất nhưng mang lại sự rõ ràng ngay lập tức cho Codebase.
