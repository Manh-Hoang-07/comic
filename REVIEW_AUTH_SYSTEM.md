# Đánh giá hệ thống JWT / Guard / Context / RBAC

> Ngày đánh giá: 2026-04-15
> Phạm vi: Toàn bộ pipeline xác thực & phân quyền trước khi request đến controller

---

## 1. Tổng quan kiến trúc

```
Request
  │
  ▼
┌─────────────────────────────────┐
│  HTTP Hardening (Helmet, HPP)   │  ← helmet, hpp, compression
└────────────────┬────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Rate Limiting (AppThrottler)   │  ← APP_GUARD #1, 100 req/min/IP
└────────────────┬────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  RequestContextMiddleware       │  ← AsyncLocalStorage, requestId, IP, UA
│  GroupContextMiddleware         │  ← Extract x-group-id header
└────────────────┬────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  SecurityGuard (APP_GUARD #2)   │  ← JWT validation + Blacklist + RBAC
│  ├─ Passport JWT Strategy       │     (song song hóa bằng Promise.all)
│  ├─ Token Blacklist check       │
│  ├─ Group scope resolution      │
│  └─ RBAC permission check       │
└────────────────┬────────────────┘
  │
  ▼
┌─────────────────────────────────┐
│  Controller / Service           │  ← Auth.user(), Auth.id(), authService
└─────────────────────────────────┘
```

**Tổng số file liên quan:** ~25 file
**Dependencies:** `@nestjs/passport`, `passport-jwt`, `@nestjs/jwt`, `jsonwebtoken`, `bcryptjs`, `@nestjs/throttler`, `helmet`

---

## 2. Điểm mạnh

| # | Điểm mạnh | File tham chiếu |
|---|-----------|-----------------|
| 1 | **SecurityGuard hợp nhất** — Gom JWT + blacklist + RBAC vào 1 guard duy nhất, giảm overhead nhiều guard chồng nhau | `security.guard.ts` |
| 2 | **Song song hóa tốt** — `Promise.all([authPromise, blacklistPromise, groupPromise, preparePromise])` giảm latency đáng kể cho protected routes | `security.guard.ts:89-94` |
| 3 | **AsyncLocalStorage-based RequestContext** — Per-request isolation không cần REQUEST scope, hiệu năng tốt hơn DI scope | `request-context.util.ts` |
| 4 | **Default deny** — Không có `@Permission()` = 403. Đây là best practice security (fail-closed) | `rbac.decorators.ts` |
| 5 | **Permission hierarchy** — Parent permission tự động grant child. `system.manage` là super permission. Rất linh hoạt | `rbac-permission-index.service.ts:118-128` |
| 6 | **Multi-layer RBAC cache** — Request-level → Redis → DB. Tránh N+1 queries trong cùng 1 request | `rbac.service.ts:42-56`, `rbac-cache.service.ts` |
| 7 | **Cache versioning + Pub/Sub invalidation** — Redis cache key có version, invalidation qua channel `rbac:invalidation` | `rbac-cache.service.ts:21-22` |
| 8 | **Token blacklist dual-store** — In-memory LRU (fast path) + Redis (cross-instance consistency) | `token-blacklist.service.ts` |
| 9 | **Account lockout** — Configurable max attempts / window / lockout duration, lưu trên Redis | `attempt-limiter.service.ts` |
| 10 | **Clean decorator API** — `@Permission('public')`, `@Permission('user')`, `@Permission('comic.create')`. Dễ hiểu, dễ dùng | `rbac.decorators.ts` |
| 11 | **Refresh token có JTI** — Mỗi refresh token có unique ID, lưu trên Redis để revoke | `token.service.ts:71` |
| 12 | **Dedup in-flight refresh** — `refreshInFlight` Map ngăn nhiều request cùng refresh permission của 1 user đồng thời | `rbac.service.ts:59-89` |
| 13 | **Optional login cho public routes** — Public route vẫn validate token nếu có, cho phép personalization | `security.guard.ts:55-66` |

---

## 3. Vấn đề phát hiện

### 3.1 CRITICAL — Cần sửa ngay

#### C1: JWT secret cho phép giá trị rỗng
**File:** `jwt.config.ts:4-5`
```typescript
secret: process.env.JWT_SECRET || '',
refreshSecret: process.env.JWT_REFRESH_SECRET || '',
```
**Vấn đề:** Nếu env variable chưa set, secret là chuỗi rỗng. Token sẽ được ký bằng empty string — bất kỳ ai cũng có thể forge token hợp lệ.
**Đề xuất:** Throw error khi khởi động nếu secret rỗng:
```typescript
secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET is required') })(),
```

#### C2: Debug logs chứa thông tin nhạy cảm ở mức WARN
**File:** `security.guard.ts:74,104,109,114` và `jwt.strategy.ts:51,61-62,72,75,83`
```typescript
this.logger.warn(`[JWT-DEBUG] url=${request.url} token=${token ? 'YES' : 'NO'} perms=${JSON.stringify(permissions)}`);
this.logger.warn(`[JWT-DEBUG] isAuthOk=${isAuthOk} isBlocked=${isBlocked} request.user=${request.user ? 'id=' + request.user.id : 'NULL'}`);
```
**Vấn đề:** `logger.warn` chạy ở production, log user ID, URL, permission codes, trạng thái auth. Đây là information leak + performance overhead trên mỗi request.
**Đề xuất:** Xóa hoàn toàn hoặc chuyển sang `logger.debug()` và bật theo env flag.

---

### 3.2 HIGH — Nên sửa sớm

#### H1: Token đầy đủ làm Redis key cho blacklist
**File:** `token-blacklist.service.ts:97-99`
```typescript
private redisKey(token: string): string {
  return `${REDIS_KEY_PREFIX}${token}`;
}
```
**Vấn đề:** JWT có thể dài 1KB+. Lưu full token làm Redis key lãng phí bộ nhớ và tăng network overhead. Ngoài ra, nếu Redis key bị log, toàn bộ token bị lộ.
**Đề xuất:** Hash token trước khi lưu:
```typescript
import { createHash } from 'crypto';
private redisKey(token: string): string {
  const hash = createHash('sha256').update(token).digest('hex');
  return `${REDIS_KEY_PREFIX}${hash}`;
}
```

#### H2: `any` type cho user ID xuyên suốt hệ thống
**File:** `auth-user.interface.ts:2`, `auth-context.helper.ts:28`, `auth.util.ts:22`
```typescript
id: any;
getCurrentUserId(context?: ExecutionContext): any | null
static id(context?: ExecutionContext): any | null
```
**Vấn đề:** Mất hoàn toàn type safety cho field quan trọng nhất. Bugs liên quan đến type mismatch (string vs number vs bigint) sẽ không bị phát hiện khi compile.
**Đề xuất:** Dùng `PrimaryKey` type đã có sẵn trong project:
```typescript
import type { PrimaryKey } from '@/common/core/utils/primary-key.util';
id: PrimaryKey;
```

#### H3: AsyncLocalStorage context bị mất sau Passport callback
**File:** `security.guard.ts:96-102`
```typescript
// Re-sync RequestContext after passport callback (passport may run
// handleRequest outside the AsyncLocalStorage context...)
if (request.user) {
  RequestContext.set('user', request.user);
  RequestContext.set('userId', request.user.id ?? null);
}
```
**Vấn đề:** Đây là workaround cho vấn đề đã biết — Passport `handleRequest` chạy ngoài AsyncLocalStorage context. Nếu bất kỳ code nào đọc `RequestContext.get('user')` giữa lúc Passport set user và lúc re-sync, sẽ nhận được `null`. Hiện tại hoạt động vì re-sync chạy ngay sau `Promise.all`, nhưng fragile nếu có thêm logic ở giữa.
**Đề xuất:** Chấp nhận workaround hiện tại nhưng thêm comment cảnh báo rõ ràng, hoặc override `super.canActivate` để wrap trong AsyncLocalStorage context.

#### H4: LRU eviction dùng sort — O(n log n)
**File:** `token-local-store.ts:71-73`
```typescript
const oldest = [...this.map.entries()].sort((a, b) => a[1] - b[1])[0];
if (oldest) this.map.delete(oldest[0]);
```
**Vấn đề:** Copy toàn bộ 10K entries rồi sort chỉ để tìm entry nhỏ nhất. Rất lãng phí.
**Đề xuất:** Dùng Map insertion order (Map đã preserve insertion order) — xóa entry đầu tiên là đủ:
```typescript
const firstKey = this.map.keys().next().value;
if (firstKey !== undefined) this.map.delete(firstKey);
```

#### H5: JTI generation không dùng crypto random
**File:** `token.service.ts:63-65`
```typescript
private generateJti(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```
**Vấn đề:** `Math.random()` không phải cryptographically secure. JTI nên unpredictable để ngăn replay attack.
**Đề xuất:**
```typescript
import { randomUUID } from 'crypto';
private generateJti(): string {
  return randomUUID();
}
```

---

### 3.3 MEDIUM — Nên cải thiện

#### M1: Dead code — `JwtAuthGuard` và `RbacGuard`
**File:** `jwt-auth.guard.ts` (212 dòng), `rbac.guard.ts` (67 dòng)
**Vấn đề:** `SecurityGuard` đã hợp nhất toàn bộ logic của cả `JwtAuthGuard` và `RbacGuard`. Hai guard cũ vẫn tồn tại nhưng không được đăng ký làm APP_GUARD. Nếu developer mới vô tình dùng `JwtAuthGuard` thay vì `SecurityGuard`, sẽ bỏ qua RBAC check.
**Đề xuất:** Xóa `JwtAuthGuard` và `RbacGuard`, hoặc đánh dấu `@deprecated` nếu muốn giữ lại tham khảo.

#### M2: `isPublic` metadata không bao giờ được set
**File:** `security.guard.ts:43-46`
```typescript
const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [...]);
```
**Vấn đề:** Không có decorator nào set metadata key `'isPublic'`. Chỉ có `PERMS_REQUIRED_KEY` với giá trị `'public'`. Dòng `isPublic` luôn là `undefined`/`false` — dead check.
**Đề xuất:** Xóa check `isPublic`, chỉ dùng `permissions.includes(PUBLIC_PERMISSION)`.

#### M3: Hai cách truy cập user — `AuthService` (REQUEST scope) vs `Auth` (static)
**File:** `auth.service.ts` (REQUEST-scoped) vs `auth.util.ts` (static)
**Vấn đề:** Hai pattern song song để lấy cùng 1 data. `AuthService` tạo instance mới mỗi request vì `Scope.REQUEST`. `Auth` static class dùng `RequestContext` hiệu quả hơn nhiều. Có nguy cơ developer dùng lẫn lộn.
**Đề xuất:** Deprecate `AuthService`, chỉ dùng `Auth` static class. Hoặc ngược lại, chọn 1 pattern và loại bỏ cái còn lại.

#### M4: Permission hierarchy traversal không có cycle protection
**File:** `rbac-permission-index.service.ts:118-128`
```typescript
private grants(need: string, has: (code: string) => boolean): boolean {
  if (has(PERM.SYSTEM.MANAGE)) return true;
  if (has(need)) return true;
  for (let cur = this.permissionByCode.get(need); cur?.parentCode; ) {
    const parent = this.permissionByCode.get(cur.parentCode);
    if (!parent) break;
    if (parent.code && has(parent.code)) return true;
    cur = parent;
  }
  return false;
}
```
**Vấn đề:** Nếu data trong DB có cycle (A→B→A), vòng lặp sẽ chạy vô hạn.
**Đề xuất:** Thêm `Set<string>` để track visited nodes:
```typescript
const visited = new Set<string>();
for (let cur = this.permissionByCode.get(need); cur?.parentCode; ) {
  if (visited.has(cur.parentCode)) break;
  visited.add(cur.parentCode);
  // ...
}
```

#### M5: Comment sai ở throttler config
**File:** `throttler.module.ts:22`
```typescript
limit: 100, // Default limit: 50 request mỗi phút cho mỗi IP
```
**Vấn đề:** Comment nói 50 nhưng giá trị là 100. Gây nhầm lẫn.

#### M6: `isActive()` default là `active` khi status undefined
**File:** `rbac-authorization.orchestrator.ts:62-63`
```typescript
private isActive(entity: { status?: string } | null | undefined): boolean {
  return (entity?.status ?? 'active') === 'active';
}
```
**Vấn đề:** Nếu entity không có field `status` → coi là active. Đây là fail-open behavior. Nên fail-closed cho security.
**Đề xuất:** Return `false` khi status undefined:
```typescript
return entity?.status === 'active';
```

---

### 3.4 LOW — Nice to have

#### L1: `requestId` generation yếu
**File:** `request-context.middleware.ts:29`
```typescript
`req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
```
**Đề xuất:** Dùng `crypto.randomUUID()` cho uniqueness đảm bảo hơn.

#### L2: `isJwtExpired()` helper có thể không cần thiết
**File:** `jwt-token.helper.ts:20-35`
**Vấn đề:** Chỉ dùng trong `JwtAuthGuard` (dead code). Passport strategy đã handle expiration với `ignoreExpiration: false`.

#### L3: `payloadLimit` default là `'1mb'`
**File:** `http-hardening.ts:9`
**Lưu ý:** Nếu có endpoint upload ảnh/file lớn, cần override. Hiện tại mặc định 1MB là hợp lý cho API thuần JSON.

---

## 4. Đánh giá tổng thể

| Tiêu chí | Điểm (1-10) | Nhận xét |
|----------|-------------|---------|
| **Kiến trúc** | 8.5/10 | Phân tầng rõ ràng, single guard hợp nhất, AsyncLocalStorage context |
| **Bảo mật** | 7/10 | Tốt về cơ bản nhưng có lỗ hổng secret rỗng, debug logs, token key |
| **Hiệu năng** | 8/10 | Song song hóa tốt, multi-layer cache, nhưng LRU sort O(n log n) |
| **Maintainability** | 6.5/10 | Dead code (2 guard cũ), dual auth pattern, `any` types nhiều |
| **Code quality** | 7/10 | Clean API, nhưng debug logs, comment sai, inconsistent patterns |
| **Tổng** | **7.4/10** | Hệ thống mạnh, thiết kế tốt. Cần cleanup dead code và fix critical issues |

---

## 5. Ưu tiên sửa

### Phải sửa ngay (Sprint hiện tại)
1. **C1** — Validate JWT secrets on startup
2. **C2** — Xóa/chuyển tất cả debug logs

### Nên sửa sớm (1-2 Sprint tới)
3. **H1** — Hash token trước khi lưu blacklist
4. **H5** — Dùng `crypto.randomUUID()` cho JTI
5. **M1** — Xóa `JwtAuthGuard` và `RbacGuard` dead code
6. **M2** — Xóa `isPublic` dead check

### Cải thiện dần
7. **H2** — Type `id` bằng `PrimaryKey` thay `any`
8. **H4** — Fix LRU eviction
9. **M3** — Chọn 1 auth access pattern
10. **M4** — Thêm cycle protection cho permission hierarchy
11. **M6** — `isActive` fail-closed

---

## 6. So sánh với best practices

| Best Practice | Status | Ghi chú |
|--------------|--------|---------|
| Default deny (no permission = forbidden) | ✅ | Implemented |
| Token blacklist / revocation | ✅ | Dual-store (memory + Redis) |
| Rate limiting | ✅ | Per-IP, configurable per-endpoint |
| Account lockout | ✅ | Redis-based, configurable |
| Refresh token rotation | ⚠️ | Có JTI nhưng chưa thấy rotate on use |
| HTTPS enforcement | ❓ | Không thấy trong code, có thể ở reverse proxy |
| CORS configuration | ❓ | Không thấy trong file đã review |
| Secret rotation strategy | ❌ | Không có cơ chế rotate JWT secret |
| Audit logging | ⚠️ | Có checkpoint tracker nhưng không log auth events riêng |
| Input validation on auth endpoints | ✅ | DTO validation qua class-validator |
| Password policy enforcement | ❓ | Chưa thấy regex/policy check khi set password |
| Session / token metadata | ⚠️ | Token không chứa device/IP fingerprint |
