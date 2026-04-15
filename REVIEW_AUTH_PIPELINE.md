# Review: Authentication & Authorization Pipeline

> **Phạm vi:** Toàn bộ luồng xử lý trước Controller — JWT, Guard, Context, RBAC
> **Ngày:** 2026-04-15

---

## 1. Tổng quan kiến trúc

```
Request
  │
  ├─ RequestContextMiddleware   → AsyncLocalStorage (tracker, ip, requestId, ...)
  ├─ GroupContextMiddleware     → Trích x-group-id header → RequestContext
  │
  ├─ SecurityGuard (APP_GUARD) ─┐
  │   ├─ Đọc @Permission() metadata
  │   ├─ Default deny (không có decorator → 403)
  │   ├─ Public route: optional auth
  │   ├─ Protected route: Promise.all([
  │   │     passport auth,
  │   │     token blacklist check,
  │   │     group scope resolution,
  │   │     permission index prepare
  │   │   ])
  │   └─ RBAC check: hasPermissions(userId, groupId, perms)
  │
  ├─ Interceptors (logging, transform, timeout, cache, file-path)
  │
  └─ Controller
```

---

## 2. Đánh giá chi tiết

### 2.1 JWT Configuration & Strategy

| File | Đánh giá |
|------|----------|
| `core/config/jwt.config.ts` | **Tốt.** `requireEnv()` bắt buộc `JWT_SECRET` và `JWT_REFRESH_SECRET`. Có issuer/audience. |
| `auth/strategies/jwt.strategy.ts` | Xem bên dưới |

**Điểm mạnh:**
- Validate cả `issuer` và `audience` — chống token dùng lại giữa các service.
- `ignoreExpiration: false` — đúng chuẩn.
- Fallback DB khi Redis không khả dụng.

**Vấn đề phát hiện:**

1. **Cache validation quá lỏng (jwt.strategy.ts:66)**
   ```ts
   if ('profile' in parsed) {
     return parsed;
   }
   ```
   Chỉ kiểm tra key `profile` tồn tại — bất kỳ object nào có field `profile` đều pass. Nên kiểm tra thêm `parsed.id` hoặc `parsed.id === userId` để đảm bảo cache đúng user.

2. **Không kiểm tra user status khi validate JWT**
   `jwt.strategy.ts` fetch user profile từ cache/DB nhưng **không kiểm tra** `user.status === 'active'`. Nếu user bị ban/suspend, token vẫn hợp lệ tối đa **1 giờ** (cache TTL). Đây là **lỗ hổng bảo mật** cho các trường hợp cần revoke account ngay lập tức.

3. **Cache toàn bộ user object (jwt.strategy.ts:85)**
   ```ts
   await this.redis.set(cacheKey, JSON.stringify(userPayload), 3600);
   ```
   Cache cả profile (có thể chứa data nhạy cảm) với TTL 1h. Nên cache chỉ các fields cần thiết cho auth/RBAC.

---

### 2.2 Security Guard

**File:** `common/auth/guards/security.guard.ts`

**Điểm mạnh:**
- **Default deny** — route không có `@Permission()` bị chặn 403. Đây là best practice.
- **Parallel execution** — `Promise.all` cho auth, blacklist, group scope, permission index. Tối ưu latency rất tốt.
- **Re-sync RequestContext** sau Passport callback — xử lý đúng vấn đề AsyncLocalStorage bị mất context trong Passport callback.
- **Checkpoint tracking** — dễ debug performance.

**Vấn đề phát hiện:**

4. **Public route auth swallow error misleading (line 55)**
   ```ts
   await this.handlePassportAuth(context).catch(() => true);
   ```
   `.catch(() => true)` trả về `true` khi auth fail — giá trị return này gây hiểu lầm (dù không ảnh hưởng logic vì kết quả không được sử dụng). Nên đổi thành `.catch(() => {})` hoặc `.catch(() => null)`.

5. **`rbac.prepare()` được gọi 2 lần**
   - Lần 1: `security.guard.ts:83` trong `Promise.all`
   - Lần 2: trong `rbac.hasPermissions()` → `rbac.service.ts:31`

   Lần 2 sẽ bị skip nhờ RequestContext marker, nhưng vẫn tạo overhead không cần thiết (function call + Map lookup). Có thể bỏ `prepare()` trong `hasPermissions()` nếu guard luôn gọi trước.

6. **`handlePassportAuth` swallow tất cả errors (line 174)**
   ```ts
   } catch (_err) {
     return false;
   }
   ```
   Mọi lỗi (kể cả lỗi hệ thống như DB connection fail) đều bị nuốt và trả về `false`. Nên log error ở mức `warn` để phát hiện vấn đề infrastructure.

---

### 2.3 RBAC System

**Điểm mạnh:**
- **Hierarchical permission** — `system.manage` tự động grant tất cả permission con. Logic duyệt cây cha có `visited` set chống loop.
- **Multi-layer caching** — RequestContext → Redis → DB. Rất tốt cho performance.
- **Cache versioning** — `bumpVersion()` invalidate toàn bộ cache qua version key, không cần xóa từng key.
- **De-duplication** — `refreshInFlight` Map ngăn concurrent refresh cho cùng scope.
- **Codec versioning** — `codes:v1:` prefix cho dữ liệu Redis, xử lý legacy `b64:v1:` format.
- **Pub/Sub invalidation** — Cross-instance cache invalidation qua Redis channel.
- **Permission index pre-warming** — 6h interval refresh, 24h TTL.

**Vấn đề phát hiện:**

7. **RBAC permission check dùng OR logic (rbac-permission-index.service.ts:69)**
   ```ts
   return required.some((need) => this.matchesAssigned(assignedCodes, need));
   ```
   `@Permission('comic.manage', 'user.manage')` = user cần **MỘT TRONG HAI**, không phải cả hai. Điều này cần được document rõ ràng, vì developer có thể hiểu nhầm là AND logic.

8. **`refreshInFlight` chỉ hoạt động trong 1 instance (rbac.service.ts:23)**
   Trong multi-instance deployment, 2 instance có thể đồng thời refresh permission cho cùng user. Không gây lỗi logic nhưng tạo duplicate DB queries. Có thể dùng Redis distributed lock nếu cần tối ưu thêm.

9. **`RbacCacheService` dùng `any` type cho userId/groupId**
   ```ts
   async getPermissions(userId: any, groupId: any | null)
   ```
   Mất type safety. Nên dùng `RbacId` type nhất quán.

---

### 2.4 Context Management

**Điểm mạnh:**
- `AsyncLocalStorage` — thread-safe, không chia sẻ state giữa concurrent requests.
- Request ID propagation — accept từ header hoặc tự generate UUID.
- Group context resolution với request-level cache.

**Vấn đề phát hiện:**

10. **GroupContextMiddleware không validate format của groupId**
    ```ts
    private extractGroupId(req: Request): string | null {
      const raw = req.headers['x-group-id'] ?? req.headers['group-id'] ?? null;
      // ... chỉ trim, không validate
    }
    ```
    Giá trị như `"DROP TABLE"`, `"<script>"`, hoặc chuỗi siêu dài đều được chấp nhận và truyền xuống DB/Redis. Nên validate format (e.g., numeric hoặc UUID pattern) tại middleware.

11. **`RbacAuthorizationOrchestrator.resolveActiveGroupScopeForRbac` swallow error (line 38)**
    ```ts
    const group = await this.groupService
      .getContextSnapshot(groupId)
      .catch(() => null);
    ```
    Lỗi DB/Redis bị nuốt và trả về "Group not found" 400. Có thể gây nhầm lẫn khi debug — user nhận 400 thay vì 500.

---

### 2.5 Token Management

**Điểm mạnh:**
- **SHA-256 hash** cho Redis key blacklist — không lưu raw token.
- **Dual-layer blacklist** — local in-memory (fast) + Redis (consistent).
- **TTL-based cleanup** cho local store.
- **Refresh token JTI** — mỗi refresh token có unique ID, lưu Redis.

**Vấn đề phát hiện:**

12. **Dùng 2 thư viện JWT khác nhau (token.service.ts)**
    ```ts
    // Access token: @nestjs/jwt
    const accessToken = this.jwtService.sign(payload);

    // Refresh token: jsonwebtoken trực tiếp
    const refreshToken = jwt.sign({ sub: userId, email, jti }, refreshSecret, { ... });
    ```
    Không nhất quán. Nếu `@nestjs/jwt` có config đặc biệt (e.g., algorithm), refresh token sẽ không áp dụng. Nên dùng cùng 1 approach.

13. **Local blacklist store không sync từ Redis (token-blacklist.service.ts:75)**
    ```ts
    if (val) {
      // Sync back to local store for future fast checks if found in Redis
      // Note: ttl is unknown here, but can put a safe default if needed
      return true;
    }
    ```
    Comment ghi nhận vấn đề nhưng chưa xử lý. Trong multi-instance, local store sẽ diverge — token bị blacklist trên instance A sẽ miss local check trên instance B mỗi lần, luôn phải đi Redis.

14. **`extractBearerToken` case-sensitive (jwt-token.helper.ts:8)**
    ```ts
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    ```
    Chỉ match `"Bearer "` (chữ B hoa). Theo RFC 7235, auth scheme comparison nên case-insensitive. Passport's `ExtractJwt.fromAuthHeaderAsBearerToken()` xử lý case-insensitive. Nếu client gửi `"bearer token123"`:
    - Passport sẽ **accept** → auth pass ✅
    - `extractBearerToken` sẽ **return null** → blacklist check bị **skip** ❌

    **Đây là lỗ hổng**: token bị blacklist vẫn có thể pass guard nếu client dùng lowercase `bearer`.

---

### 2.6 Auth Utilities

**Vấn đề phát hiện:**

15. **3 cách truy cập user hiện tại — dễ gây nhầm lẫn**
    - `Auth.user()` — static utility, dùng RequestContext
    - `AuthService` (request-scoped) — inject qua constructor
    - `request.user` — truy cập trực tiếp

    Nên chọn 1 approach chính và deprecate/remove các cách còn lại.

16. **Request-scoped `AuthService` (common/auth/services/auth.service.ts)**
    ```ts
    @Injectable({ scope: Scope.REQUEST })
    export class AuthService {
    ```
    `Scope.REQUEST` tạo instance mới mỗi request, và **cascade** sang tất cả service inject nó — chúng cũng trở thành request-scoped. Đây là performance concern trong NestJS. Static `Auth` utility đã cung cấp đầy đủ chức năng tương đương mà không có overhead này.

---

## 3. Tổng hợp vấn đề theo mức độ

### Nghiêm trọng (Cần fix ngay)

| # | Vấn đề | File | Mô tả |
|---|--------|------|-------|
| 14 | `extractBearerToken` case-sensitive | `jwt-token.helper.ts:8` | Token blacklist có thể bị bypass bằng lowercase `bearer`. Fix: dùng case-insensitive comparison. |
| 2 | Không check user status trong JWT validate | `jwt.strategy.ts` | User bị ban/suspend vẫn access được tối đa 1h. Fix: check `status === 'active'` sau khi fetch user. |
| 10 | GroupId header không validate | `group-context.middleware.ts` | Input không trusted đi thẳng xuống DB. Fix: validate format tại middleware. |

### Trung bình (Nên fix)

| # | Vấn đề | File | Mô tả |
|---|--------|------|-------|
| 1 | Cache validation quá lỏng | `jwt.strategy.ts:66` | Check `'profile' in parsed` không đủ. |
| 12 | 2 thư viện JWT khác nhau | `token.service.ts` | Không nhất quán, khó maintain. |
| 13 | Local blacklist không sync từ Redis | `token-blacklist.service.ts:75` | Cross-instance divergence. |
| 11 | Error swallow trong group resolution | `rbac-authorization.orchestrator.ts:38` | Lỗi infra trả 400 thay vì 500. |

### Thấp (Cải thiện chất lượng code)

| # | Vấn đề | File | Mô tả |
|---|--------|------|-------|
| 4 | `.catch(() => true)` misleading | `security.guard.ts:55` | Return value gây hiểu lầm. |
| 5 | `prepare()` gọi trùng | `security.guard.ts:83` | Overhead nhỏ, không ảnh hưởng logic. |
| 6 | Swallow tất cả auth errors | `security.guard.ts:174` | Khó debug infra issues. |
| 7 | OR logic chưa document rõ | `rbac-permission-index.service.ts:69` | Developer dễ hiểu nhầm AND. |
| 9 | `any` type usage | `rbac-cache.service.ts` | Mất type safety. |
| 15 | 3 cách access user | Nhiều files | Dễ gây inconsistency. |
| 16 | Request-scoped AuthService | `common/auth/services/auth.service.ts` | Performance overhead, cascade scope. |

---

## 4. Đánh giá tổng thể

| Tiêu chí | Điểm | Ghi chú |
|----------|-------|---------|
| **Kiến trúc** | 9/10 | Phân tách rõ ràng, flow logic chặt chẽ, default deny |
| **Bảo mật** | 7/10 | 3 vấn đề nghiêm trọng cần fix (bearer case, user status, groupId validation) |
| **Hiệu năng** | 9/10 | Parallel execution, multi-layer caching, de-duplication rất tốt |
| **Khả năng maintain** | 7/10 | Nhiều `any` type, 3 cách access user, 2 thư viện JWT |
| **Error handling** | 6/10 | Nhiều chỗ swallow error, khó debug khi có vấn đề production |
| **Tổng** | **7.6/10** | Pipeline chất lượng tốt, cần fix 3 vấn đề bảo mật và cải thiện error handling |

---

## 5. Gợi ý fix nhanh cho 3 vấn đề nghiêm trọng

### Fix #14: Case-insensitive bearer extraction

```ts
// jwt-token.helper.ts
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return token.length > 0 ? token : null;
}
```

### Fix #2: Check user status trong JWT strategy

```ts
// jwt.strategy.ts — trong validate()
if (!user) return null;
if (user.status !== 'active') return null;  // ← thêm dòng này

// Tương tự cho cached user:
if (cachedUser) {
  const parsed = JSON.parse(cachedUser);
  if ('profile' in parsed) {
    if (parsed.status !== 'active') return null;  // ← thêm dòng này
    return parsed;
  }
}
```

### Fix #10: Validate groupId format

```ts
// group-context.middleware.ts
private extractGroupId(req: Request): string | null {
  const raw = req.headers['x-group-id'] ?? req.headers['group-id'] ?? null;
  if (Array.isArray(raw)) return this.sanitize(raw[0]);
  if (typeof raw === 'string') return this.sanitize(raw);
  return null;
}

private sanitize(val: string | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed.length === 0 || trimmed.length > 36) return null;
  // Chỉ cho phép numeric hoặc UUID format
  if (!/^[0-9a-f\-]+$/i.test(trimmed)) return null;
  return trimmed;
}
```
