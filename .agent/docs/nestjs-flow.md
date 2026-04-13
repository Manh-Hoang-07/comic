# Luồng chạy NestJS trong dự án này

Tài liệu này mô tả **luồng khởi động app** và **luồng xử lý 1 HTTP request** trong codebase hiện tại của bạn (theo `src/main.ts` và `src/app.module.ts`).

## Bootstrap (app start) chạy như thế nào?

Điểm vào chương trình là `src/main.ts` với hàm `bootstrap()`.

- **B1. Patch runtime (BigInt)**: gọi `patchBigInt()`.
- **B2. Tạo Nest app**: `NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true })`.
- **B3. Nạp config**: `app.get(ConfigService)` và đọc các key:
  - `app.port` (mặc định `8000`)
  - `app.globalPrefix` (mặc định `api`)
  - `app.corsEnabled`, `app.corsOrigins`
  - `app.environment`, `app.name`, `app.version`, `app.timezone`
- **B4. Gắn logger tuỳ biến**: `app.get(CustomLoggerService)` rồi `app.useLogger(logger)`.
- **B5. Cấu hình nền tảng HTTP**:
  - `applyCors(app, ...)`
  - `applyHttpHardening(app, '10mb')`
  - `app.set('trust proxy', true)` (best effort)
- **B6. Set global prefix**: `app.setGlobalPrefix(appConfig.globalPrefix)` → mặc định mọi route nằm dưới `/api`.
- **B7. Static assets**: `setupStaticAssets(app, configService)`.
- **B8. Swagger**: bật khi `app.environment !== 'production'`, mount ở `/${globalPrefix}/docs` (mặc định `/api/docs`).
- **B9. Global validation pipes**: `applyGlobalPipes(app, ...)`.
- **B10. Shutdown hooks**: `app.enableShutdownHooks()` và `registerShutdown(app, logger)`.
- **B11. Listen**: `app.listen(appConfig.port)`.

## Luồng HTTP request đi qua những “tầng” nào?

Trong NestJS, một request thường đi theo chuỗi “tầng” (pipeline) sau. Với dự án của bạn, các tầng quan trọng đã được gắn ở **2 nơi**:

- **`src/main.ts`**: cấu hình app-level (CORS, hardening, globalPrefix, global pipes…).
- **`src/app.module.ts`**: gắn **middleware cho mọi route**, và cấu hình **global filters / interceptors / guard**.

### Tổng quan pipeline (thứ tự tư duy)

> Thứ tự chi tiết có thể khác nhau tuỳ cách bạn đăng ký, nhưng để hiểu và debug hiệu quả trong dự án này, bạn có thể bám theo chuỗi sau:

1. **Express-level middlewares** (CORS / hardening / static / trust proxy)  
   - Cấu hình trong `src/main.ts` qua `applyCors`, `applyHttpHardening`, `setupStaticAssets`, `trust proxy`.
2. **Nest Middleware** (chạy trước route handler)  
   - Ở `src/app.module.ts`:
     - `RequestContextMiddleware`
     - `GroupContextMiddleware`
     - áp cho `forRoutes('*')` ⇒ mọi endpoint.
3. **Guard** (AuthN/AuthZ)  
   - Global guard: `{ provide: APP_GUARD, useClass: SecurityGuard }`.
4. **Pipes** (validate/transform input)  
   - Global pipes được gắn qua `applyGlobalPipes(app, ...)` trong `src/main.ts`.
5. **Interceptor (Before)**  
   - Global interceptors được đăng ký trong `AppModule` (xem mục bên dưới).
6. **Controller handler**  
   - Các method có decorator như `@Get`, `@Post`, `@Patch`… trong `*.controller.ts`.
7. **Service / Use-case**  
   - Thường là `*.service.ts` hoặc các orchestrator trong `modules/core/...`.
8. **Repository / ORM / DB**  
   - Repo bạn có các module kiểu `*.repository.module.ts` (và README nói dùng Prisma).
9. **Interceptor (After)** → transform response / cache / logging response…
10. **Exception Filter** (khi có lỗi throw ra ở bất kỳ tầng nào phía trong)

### Các “tầng” cụ thể đang được gắn global trong `AppModule`

`src/app.module.ts` đang gắn:

- **Global Filters** (bắt lỗi và map thành response chuẩn):
  - `HttpExceptionFilter`
  - `QueryFailedFilter`
- **Global Interceptors**:
  - `PublicHttpCacheInterceptor`
  - `LoggingInterceptor`
  - `TransformInterceptor`
  - `FilePathInterceptor`
  - `TimeoutInterceptor`
- **Global Guard**:
  - `SecurityGuard`
- **Middleware (Nest)**:
  - `RequestContextMiddleware`
  - `GroupContextMiddleware`

> Lưu ý: Interceptor được đăng ký theo thứ tự trong `providers`. Khi debug bạn nên xem chúng theo đúng thứ tự đó vì “bọc” (wrap) nhau.

## “Security” chạy thế nào trong dự án của bạn?

Bạn có **global guard** là `SecurityGuard` (`src/common/auth/guards/security.guard.ts`). Guard này kế thừa `AuthGuard('jwt')` (Passport JWT) nhưng có thêm logic:

### Cách xác định route Public vs Protected

Guard đọc metadata bằng `Reflector`:

- **Public flag**: key `'isPublic'` (thường đến từ decorator kiểu `@Public()`).
- **Permissions required**: key `PERMS_REQUIRED_KEY` (từ `@Permissions(...)` hoặc tương đương).
- **Public permission**: `PUBLIC_PERMISSION` (coi như public nếu permissions chứa giá trị này).

### Nhánh Public

Nếu route là public:

- Nếu request có token thì guard sẽ **thử** chạy Passport JWT (để lấy `user_id`/context) nhưng **không bắt buộc** đăng nhập.
- Sau đó trả `true` cho phép đi tiếp.

### Nhánh Protected

Nếu route là protected:

- Guard chạy song song:
  - **JWT auth** qua Passport (`super.canActivate(context)`)
  - **Token blacklist**: `tokenBlacklist.has(token)` (nếu có token)
  - **RBAC scope** (chỉ khi cần quyền cao hơn “user”): `rbacAuthz.resolveActiveGroupScopeForRbac()`
  - **RBAC prepare**: `rbac.prepare()`
- Validate:
  - Auth fail → 401
  - Token bị blacklist → clear auth context → 401
  - Nếu cần RBAC → `rbac.hasPermissions(userId, groupId, permissions)` fail → 403

### Auth context được set ở đâu?

`SecurityGuard.handleRequest(...)` sẽ:

- Nếu có user hợp lệ: set `request.user`, `request.userId` và set vào `RequestContext` (`RequestContext.set('user', ...)`, `RequestContext.set('userId', ...)`)
- Nếu không: clear hết các field trên

Ý nghĩa thực tế: các chỗ khác trong code có thể gọi tiện ích `Auth.*()` / `RequestContext.get(...)` để lấy user mà không cần `ExecutionContext`.

## Xác định “tầng” trong NestJS bằng cách nào? (Checklist nhanh)

Khi bạn nhìn một file/class và muốn biết nó nằm ở tầng nào, dùng các tín hiệu sau:

- **Bootstrap/App-level**: `src/main.ts`, thư mục `src/bootstrap/*`
  - Dấu hiệu: `NestFactory.create`, `app.use(...)`, `app.setGlobalPrefix`, `SwaggerModule`, `applyGlobalPipes`.
- **Module (composition / wiring)**: `*.module.ts`
  - Dấu hiệu: `@Module({ imports, providers, controllers, exports })`.
  - `AppModule` là “root module” tổng hợp.
- **Middleware**: `*.middleware.ts` hoặc class được `consumer.apply(...).forRoutes(...)`
  - Chạy trước guard/pipe/interceptor ở mức route.
- **Guard (AuthN/AuthZ)**: `*.guard.ts`
  - Dấu hiệu: implements `CanActivate` hoặc extends `AuthGuard(...)`.
  - Ở dự án này: global `SecurityGuard`.
- **Pipe (validation/transform input)**: `*.pipe.ts`
  - Dấu hiệu: implements `PipeTransform`, thường liên quan DTO + validation.
  - Global pipes được gắn trong `applyGlobalPipes(...)`.
- **Interceptor (wrap request/response)**: `*.interceptor.ts`
  - Dấu hiệu: implements `NestInterceptor`, dùng `next.handle()` và `pipe(...)`.
  - Dự án bạn đăng ký nhiều interceptor global trong `AppModule`.
- **Filter (error handling)**: `*.filter.ts`
  - Dấu hiệu: implements `ExceptionFilter`, `catch(exception, host)`.
  - Dự án bạn có `HttpExceptionFilter`, `QueryFailedFilter` global.
- **Controller (entrypoint HTTP)**: `*.controller.ts`
  - Dấu hiệu: `@Controller(...)`, method `@Get/@Post...`.
- **Service (business logic)**: `*.service.ts`
  - Dấu hiệu: `@Injectable()`, được inject vào controller.
- **Repository / Data access**: `*.repository.ts`, `*.repository.module.ts`
  - Dấu hiệu: gọi Prisma/DB, query, mapping persistence.

## Luồng minh hoạ (ASCII)

```text
Client
  |
  |  (CORS / hardening / static / trust proxy)  [main.ts]
  v
Nest Middleware: RequestContextMiddleware -> GroupContextMiddleware  [AppModule.configure]
  v
Global Guard: SecurityGuard (jwt + blacklist + rbac)                [APP_GUARD]
  v
Global Pipes (validate DTO, transform input)                        [applyGlobalPipes]
  v
Global Interceptors (before)                                        [APP_INTERCEPTOR]
  v
Controller -> Service -> Repository/DB
  v
Global Interceptors (after) -> response transform/log/cache
  v
Global Filters (if throw) -> HttpExceptionFilter / QueryFailedFilter
  v
Client
```

## Gợi ý debug nhanh trong dự án này

- Nếu request “không vào controller”: kiểm tra lần lượt
  - middleware (`RequestContextMiddleware`, `GroupContextMiddleware`)
  - `SecurityGuard` (public/permissions/blacklist/RBAC)
  - global pipes (DTO validation)
  - timeout interceptor
- Nếu response format “lạ”: xem `TransformInterceptor` và các filter.

