# Ke hoach refactor Context + RBAC (chuan chinh)

Tai lieu nay mo ta ke hoach sua kien truc phan giai context/group va check quyen RBAC theo huong de hieu, de bao tri, de nang cap.

## 1) Muc tieu

- Tach ro trach nhiem:
  - Middleware: resolve context/group cho request.
  - Guard: chi check quyen.
- Loai bo phu thuoc thu tu `Guard`/`Interceptor` gay loi logic.
- Giu hanh vi hien tai (khong pha API FE) trong giai doan chuyen doi.

## 2) Van de hien tai

- `RbacGuard` chay truoc `GroupInterceptor` theo lifecycle NestJS.
- `RbacGuard` can `groupId` de check quyen, nhung `groupId` moi duoc set o interceptor.
- Dan den tinh huong check quyen sai scope (co luc roi ve system scope).

## 3) Dinh huong kien truc moi

### 3.1 GroupContextMiddleware (moi)

- Nhiem vu:
  - Doc `x-group-id` (`group-id`, `group_id` fallback).
  - Resolve group + context (co cache).
  - Set vao `RequestContext`:
    - `groupId`
    - `context`
    - `contextId`
  - Rule fallback:
    - Route public + khong co header group: set context null.
    - Route non-public + khong co header group: fallback system context.

### 3.2 RbacGuard (toi gian hoa)

- Chi doc du lieu tu `RequestContext`.
- Khong parse header truc tiep (sau khi ket thuc giai doan compatibility).
- Logic check quyen giu nguyen:
  - `userHasPermissionsInGroup(userId, groupId, requiredPermissions)`.

### 3.3 GroupInterceptor

- Bo logic resolve context/group.
- Neu can, giu lai cho muc dich log/transform khac.

## 4) Ke hoach trien khai theo phase

## Phase 1 - Compatibility mode (an toan)

1. Tao `GroupContextMiddleware` tu logic hien tai cua `GroupInterceptor`.
2. Dang ky middleware sau `RequestContextMiddleware` trong `AppModule`.
3. Giu nguyen `RbacGuard` fallback doc header (tam thoi) de tranh vo request cu.
4. Giu `GroupInterceptor` nhung bo set `RequestContext` (hoac de no no-op cho context).

KQ mong doi:
- Tat ca request vao guard da co `RequestContext.groupId/context`.
- Behavior khong thay doi doi voi FE.

## Phase 2 - Clean up

1. Xoa fallback doc header trong `RbacGuard`.
2. Xoa debug log tam:
   - `logs/user-getlist-debug.log`
   - `logs/group-context-debug.log`
3. Gon `GroupInterceptor` chi con nhiem vu lien quan den interceptor (neu can), hoac remove khoi `APP_INTERCEPTOR`.

KQ mong doi:
- Codebase de hieu: context o middleware, quyen o guard.

## Phase 3 - Toi uu hieu nang nhe

1. Them L1 memory cache ngan han (30-60s) cho lookup `groupId -> context`.
2. Tiep tuc dung cache Redis hien tai cua `AdminGroupService.getOne`.
3. Theo doi log latency cho cac route admin co RBAC.

## 5) Danh sach file du kien thay doi

- `src/common/http/middlewares/group-context.middleware.ts` (moi)
- `src/app.module.ts` (dang ky middleware)
- `src/common/auth/guards/rbac.guard.ts` (don gian hoa sau phase 2)
- `src/common/http/interceptors/group.interceptor.ts` (giam/chuyen vai tro)

## 6) Ke hoach test

## 6.1 Functional test

- Dang nhap `super admin`:
  - Khong gui `x-group-id`, goi `GET /api/admin/users` -> pass.
- Dang nhap `group owner`:
  - Gui `x-group-id` dung group -> pass.
  - Gui `x-group-id` group khac (khong co role) -> 403.
  - Khong gui `x-group-id` voi route can quyen theo group -> verify dung policy he thong.

## 6.2 Regression test

- Cac route public khong bi anh huong:
  - `/api/public/*`
  - `/api/user/profile`
  - `/api/admin/user/menus`
- Kiem tra `GET /api/admin/users`:
  - Group scope chi thay user thuoc group.
  - System scope thay du lieu toan he thong.

## 6.3 Performance test

- So sanh latency truoc/sau tren cac route:
  - `/api/admin/users`
  - `/api/admin/user/menus`
- Muc tieu: khong tang dang ke (<= 5-10% trong dieu kien local test).

## 7) Tieu chi hoan tat (Definition of Done)

- Context resolution khong con nam trong interceptor.
- RbacGuard khong can fallback header (sau phase 2).
- Test pass cho 2 scope:
  - system
  - group
- Khong con log debug tam trong production flow.

## 8) Ghi chu cho FE

- FE tiep tuc gui `x-group-id` khi thao tac trong group scope.
- Khong can thay doi contract API trong dot refactor nay.
