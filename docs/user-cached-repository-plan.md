# Kế hoạch: Cache repository cho User

## Mục tiêu

- Thêm lớp **decorator** `CachedUserRepository` implement `IUserRepository`, bọc quanh `UserRepositoryImpl` (Prisma).
- Tập trung cache read path (ưu tiên `findById`) và **invalidate** khi dữ liệu user thay đổi.
- Giữ service/controller không phải nhớ gọi Redis ở nhiều chỗ (trừ khi đã có logic đặc thù như JWT — có thể thống nhất key sau).

## Phạm vi cache (đề xuất v1)

| Hành động | Cache? | Ghi chú |
|-----------|--------|---------|
| `findById(id)` không có `options.select` / `options.include` | Có | Key theo `userId`, TTL cố định (vd. 300s) hoặc cấu hình env |
| `findById(id, { select, include })` | Không (hoặc key riêng) | Tránh cache sai shape / trùng key |
| `findOne`, `findManyByIds`, `findAll`, … | Không cache v1 | Giảm độ phức tạp; bổ sung sau nếu cần |
| `create` / `update` / `delete` | Không cache, chỉ **invalidate** | Xóa key user liên quan |

## Token & DI (NestJS)

1. Thêm token mới (ví dụ) `USER_REPOSITORY_BASE = 'IUserRepositoryBase'` — chỉ dùng nội bộ module để inject **repo thật**.
2. `UserRepositoryImpl` → `provide: USER_REPOSITORY_BASE`, `useExisting: UserRepositoryImpl`.
3. `CachedUserRepository` → inject `@Inject(USER_REPOSITORY_BASE) inner: IUserRepository` + `RedisUtil` (hoặc service cache hiện có).
4. `USER_REPOSITORY` (token public) → `useExisting: CachedUserRepository` để mọi nơi inject như hiện tại vẫn nhận bản có cache.

**Lưu ý:** `UserRepositoryModule` (global) cần cập nhật tương tự `UserModule` để không bind nhầm hai lần `UserRepositoryImpl` cho cùng token.

## File dự kiến

| File | Nội dung |
|------|----------|
| `src/modules/core/user/infrastructure/repositories/cached-user.repository.ts` | Class decorator, forward methods, cache + invalidate |
| `src/modules/core/user/domain/user.repository.ts` | (Tuỳ chọn) export thêm `USER_REPOSITORY_BASE` nếu đặt token ở domain |
| `src/modules/core/user/user.module.ts` | Đăng ký provider theo thứ tự: Impl → Base → Cached → `USER_REPOSITORY` |
| `src/modules/core/iam/user.repository.module.ts` | Đồng bộ provider với `UserModule` |

## Khóa Redis & đồng bộ với JWT

- Hiện `JwtStrategy` dùng key dạng `user:profile:${userId}` (và có logic cache JSON).
- **Quyết định cần làm:** hoặc
  - **A)** Dùng **cùng một key** cho cache repo và JWT (một nguồn sự thật), hoặc
  - **B)** Tách key rõ (`user:repo:findById` vs `user:profile`) và khi invalidate **xóa cả hai**.

Khuyến nghị v1: **invalidate cả hai prefix** khi `update`/`delete` user (và khi đổi password nếu ảnh hưởng payload JWT).

## Serialize dữ liệu

- Dùng cùng trick `JSON.stringify` với reviver `bigint` như `JwtStrategy` nếu cache object có `BigInt`, tránh lỗi khi `JSON.stringify` trực tiếp.

## Invalidate — danh sách chỗ cần gọi (sau khi có repo cache)

- Trong `CachedUserRepository`: sau `update`, `delete`, `upsert` (nếu expose qua interface), và có thể hook `create` nếu cần (thường không có cache cho user mới).
- Các luồng **bypass** repo (vd. `prisma.user.update` trực tiếp) — rà soát codebase; nếu có thì vẫn phải invalidate ở đó hoặc gom về repo.

## Kiểm thử thủ công

1. Gọi API lấy user theo id hai lần — lần 2 không hit DB (log Prisma hoặc breakpoint).
2. `PATCH` user — gọi lại `get` — phải thấy dữ liệu mới (cache miss hoặc đã xóa key).
3. JWT validate path vẫn hoạt động; sau update user, cache profile/JWT không còn stale.

## Rủi ro & hạn chế

- **Stale data:** TTL + invalidate phải đủ; race condition nhỏ vẫn có thể xảy ra.
- **Memory/Redis size:** Chỉ cache object vừa đủ (đã có `defaultDetailSelect`); tránh cache full user có password.
- **Độ phức tạp:** Một lớp decorator thêm; team cần biết khi debug “sao không thấy DB query”.

## Thứ tự triển khai đề xuất

1. Thêm token `USER_REPOSITORY_BASE` + file `cached-user.repository.ts` (skeleton forward toàn bộ method).
2. Implement cache cho `findById` + invalidate trong `update`/`delete`.
3. Wire `UserModule` + `user.repository.module.ts`.
4. Thống nhất key Redis với JWT và cập nhật invalidate.
5. Chạy app, test thủ công các bước trên.

---

*Sau khi bạn duyệt kế hoạch này, bước tiếp theo là implement code theo thứ tự mục “Thứ tự triển khai đề xuất”.*
