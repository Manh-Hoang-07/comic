# Đánh giá luồng check quyền hiện tại (so với `rbac-luong-phan-quyen-va-check.md`)

Tài liệu đối chiếu: [`docs/rbac-luong-phan-quyen-va-check.md`](./rbac-luong-phan-quyen-va-check.md).

Phạm vi: luồng **runtime** — middleware ngữ cảnh nhóm, `JwtAuthGuard` / `RbacGuard`, `RbacService`, cache Redis & L1, bitmap permission, catalog.

---

## 1. Mức độ khớp với khung trong tài liệu nội bộ

| Ý trong tài liệu | Thực tế trong code | Ghi chú |
|------------------|-------------------|---------|
| Deny by default, metadata route | Có: thiếu `@Permission` → 403 | Khớp (`RbacGuard`). |
| `public` / chỉ cần đăng nhập | Có: `public`, `user` | Khớp (`rbac.decorators.ts`). |
| Scope user + group (hoặc system) | Có: header `x-group-id` / `group-id` → `groupIdRaw`; `null` → role trên group `code: 'system'` | Khớp middleware + `findActiveRoleIds`. |
| Validate group/context active | Có: `getContextSnapshot` + `isActive` | Khớp. |
| Gom permission từ role, so khớp | Có: bitmap + `hasAnyRequiredFromAssignedBitmap` (OR) | Khớp. |
| Kế thừa + siêu quyền | Có: `system.manage`, walk `parentCode` | Khớp (`RbacPermissionIndexService.grants`). |
| Cache theo (user, group), theo request | Có: Redis key có `version`, L1, `RequestContext` cho bitmap + catalog | Khớp. |
| Invalidate / version | Có: `bumpVersion`, pub/sub `rbac:invalidation`, refresh chỉ mục permission | Khớp. |
| Dedup refresh đồng thời | Có: `refreshInFlight` trong `RbacService` | Khớp. |

**Kết luận:** Luồng hiện tại **đã bao phủ đầy đủ** các lớp mà tài liệu mô tả; không thiếu “mảnh ghép” lớn so với khung đó.

---

## 2. Ưu điểm của luồng đang dùng

1. **Bitmap dense index** — Kiểm tra nhiều permission (và kế thừa) không cần giữ set string lớn trên mỗi request sau khi đã build bitmap; phù hợp latency khi catalog lớn.
2. **Tách lớp cache rõ** — Request-scope tránh lặp trong cùng request; Redis + version tránh bitmap cũ khi đổi catalog; L1 giảm đọc Redis.
3. **An toàn phạm vi system vs group** — Không gửi header group thì không “lấy nhầm” role theo group khác; role system gắn với group đặc biệt `code: 'system'`.
4. **Ràng buộc role theo context khi gán** — `validateRolesForContext` giảm risk gán role sai không gian (group vs system).
5. **Đồng bộ hóa khi đổi IAM** — `permission.service` / `role.service` gọi `bumpVersion`, đồng bộ với refresh chỉ mục permission (pub/sub).

---

## 3. Nhược điểm & rủi ro

1. **Phụ thuộc header `x-group-id`** — Route “chỉ đúng trong group” nhưng client quên header → check theo **system**; dễ gây **403 khó hiểu** hoặc thiết kế API không rõ (tài liệu OpenAPI/client nên nêu rõ bắt buộc header). Không phải lỗi bảo mật kiểu “leo thang quyền” theo group khác, nhưng là **rủi ro UX / contract**.
2. **Chi phí mỗi request có group** — `RbacGuard` gọi `getContextSnapshot` **trước** RBAC → thêm **ít nhất một truy vấn/IO** so với chỉ đọc cache permission. Chấp nhận được nếu snapshot đã tối ưu; nếu chưa cache snapshot theo `groupId`, đây là điểm nóng latency.
3. **Hành vi OR của mảng `@Permission('a','b')`** — Đúng với tài liệu; nếu sau này cần **AND**, decorator hiện tại **không** diễn đạt được — phải mở rộng metadata hoặc tách route.
4. **`RbacCacheService.hasPermission` luôn trả `false`** — Ghi chú “legacy”; nếu còn chỗ gọi sẽ **sai âm thầm**. Nên deprecate/xóa hoặc implement đúng.
5. **Redis tắt / mất kết nối** — `getPermissions` coi như miss liên tục → mỗi request có thể **refresh full** (DB + build bitmap), tải cao. Cần chiến lược vận hành (bật Redis hoặc TTL in-process có kiểm soát).
6. **Thay đổi DB “vòng ngoài”** — Sửa trực tiếp `role_has_permission` / assignment mà không qua service đã gắn `bumpVersion` / `refreshUserPermissions` → **cache stale** tới khi TTL hết hoặc tới lần bump. Rủi ro vận hành, không phải bug luồng chính.
7. **Global guard dư thừa trên controller** — Một số controller thêm `@UseGuards(RbacGuard)` trong khi `AppModule` đã `APP_GUARD` `RbacGuard` — có thể **dư guard** (tuỳ phiên bản Nest: thường không phá, nhưng khó đọc và dễ hiểu nhầm thứ tự với JWT).

---

## 4. Có tối ưu hơn được không?

**Có**, nhưng là **tối ưu từng phần**, không bắt buộc đổi kiến trúc:

| Hướng | Mục tiêu | Ghi chú |
|-------|----------|---------|
| **Song song hóa** | Giảm latency request có group | `preparePermissionCheck()` **không** phụ thuộc group → có thể `Promise.all` với `getContextSnapshot` (sau đó mới validate & `getUserPermissions`). |
| **Cache snapshot group** | Giảm DB cho cùng `groupId` | L1 ngắn TTL hoặc cache trong `RequestContext` nếu cùng request gọi nhiều lần (hiện guard thường một lần). |
| **Fast path** | Giảm tải khi không cần bitmap | Ví dụ nếu route chỉ cần một permission và role ít — hiếm khi đáng so với complexity; bitmap hiện đã khá tối ưu. |
| **Metadata “bắt buộc group”** | Rõ contract & fail fast | Ví dụ flag trên decorator: không có header group → 400 thay vì check system. |
| **AND permission** | Đúng policy tương lai | Mở rộng metadata + guard, hoặc dùng policy engine riêng. |

**Không** khuyến nghị đổi hết sang mô hình khác (ABAC thuần, check SQL từng permission mỗi request, v.v.) nếu chưa có yêu cầu sản phẩm rõ — **ROI thấp** so với chi phí.

---

## 5. Việc nên làm (theo mức ưu tiên gợi ý)

**P1 — Rõ ràng & an toàn vận hành**

- Chuẩn hóa tài liệu API: route nào **bắt buộc** `x-group-id`, route nào dùng system.
- Rà soát mọi chỗ ghi assignment / role-permission: luôn qua service đã `bumpVersion` / `refreshUserPermissions`.

**P2 — Code hygiene**

- Xử lý `hasPermission` legacy (xóa hoặc implement đúng).
- Bỏ `@UseGuards(RbacGuard)` thừa nơi đã có global guard (giữ `JwtAuthGuard` nếu controller cố tình override — cần kiểm tra từng file).

**P3 — Hiệu năng (khi có số liệu)**

- Đo latency `getContextSnapshot` vs RBAC; nếu cao → cache snapshot hoặc song song hóa với `preparePermissionCheck` như mục 4.

**P4 — Nâng cấp chức năng (khi có nhu cầu)**

- Hỗ trợ AND hoặc policy phức tạp hơn OR đơn giản.

---

## 6. Tóm tắt

Luồng check quyền hiện tại **đã khá “nâng cao”** so với khung trong `rbac-luong-phan-quyen-va-check.md`: bitmap, version cache, kế thừa permission, phân tách system/group, dedup refresh. **Không có lỗ hổng kiến trúc lớn** bắt buộc phải sửa ngay; các cải tiến chủ yếu là **latency (song song / cache group)**, **contract header**, **dọn code legacy**, và **kỷ luật invalidate** khi thay đổi dữ liệu ngoài đường chính.
