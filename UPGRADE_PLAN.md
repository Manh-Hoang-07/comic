# Kế hoạch nâng cấp Dependencies

> **Project:** Comic (NestJS 10 / Node 20)
> **Ngày lập:** 2026-04-14
> **Tổng packages outdated:** 36
> **Test coverage:** 97 unit tests + 12 e2e tests

---

## Tổng quan

| Phase | Nội dung | Rủi ro | Effort | Khuyến nghị |
|:-----:|----------|:------:|:------:|:-----------:|
| 1 | Patch/Minor trong semver range | THẤP | 5 phút | Làm ngay |
| 2 | Dependencies độc lập (helmet, joi, supertest, nodemailer, class-validator...) | THẤP → TB-CAO | 1-2 giờ | Làm trên branch riêng |
| 3 | ESLint 8→10 + flat config | TRUNG BÌNH | 30-60 phút | Làm trên branch riêng |
| 4 | NestJS 10→11 (toàn bộ ecosystem) | CAO | 2-4 giờ | Research kỹ trước |
| 5 | TypeScript 6 + Jest 30 | CAO | 1-2 giờ | Hoãn Jest 30 |

---

## Phase 1: Patch/Minor an toàn

**Rủi ro: THẤP** | Không có breaking changes, nằm trong semver range.

| Package | Current | Target | Loại |
|---------|---------|--------|------|
| @aws-sdk/client-s3 | 3.1017.0 | 3.1030.0 | minor |
| @prisma/adapter-mariadb | 7.3.0 | 7.7.0 | minor |
| @prisma/adapter-pg | 7.3.0 | 7.7.0 | minor |
| @prisma/client | 7.3.0 | 7.7.0 | minor |
| prisma | 7.3.0 | 7.7.0 | minor |
| @nestjs/mapped-types | 2.1.0 | 2.1.1 | patch |
| prettier | 3.8.1 | 3.8.2 | patch |
| ts-jest | 29.4.6 | 29.4.9 | patch |
| ts-loader | 9.5.4 | 9.5.7 | patch |
| baseline-browser-mapping | 2.10.11 | 2.10.18 | patch |
| @types/node | 20.19.37 | 20.19.39 | patch |

### Thực hiện

```bash
npm update @aws-sdk/client-s3 @prisma/adapter-mariadb @prisma/adapter-pg @prisma/client prisma @nestjs/mapped-types prettier ts-jest ts-loader baseline-browser-mapping @types/node
```

### Verify

```bash
npm run build && npm test
```

**Files ảnh hưởng:** Không cần sửa code. Nếu dùng Prisma migration mới, chạy lại `npx prisma generate`.

---

## Phase 2: Dependencies độc lập

Nâng từng package riêng lẻ, không phụ thuộc NestJS core. Thứ tự từ rủi ro thấp đến cao.

---

### 2a. helmet 7 → 8

**Rủi ro: THẤP**

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | `src/bootstrap/http-hardening.ts` (duy nhất) |
| Cách dùng | `app.use(helmet({ contentSecurityPolicy: false, ... }))` |
| Breaking changes có thể | Option names, default values |

```bash
npm install helmet@latest
```

**Verify:** Build thành công + kiểm tra response headers (CSP, CORP, COOP, Referrer-Policy).

---

### 2b. joi 17 → 18

**Rủi ro: THẤP**

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | `src/core/core.module.ts` (duy nhất) |
| Cách dùng | `Joi.object({...})` cho env validation (25+ biến) |
| Breaking changes có thể | Validation methods, URI scheme syntax |

```bash
npm install joi@latest
```

**Verify:** App khởi động được với `.env` hiện tại. Nếu lỗi validation, check console error message.

---

### 2c. supertest 6 → 7 + @types/supertest 6 → 7

**Rủi ro: THẤP** — Package cũ đã bị **deprecated**.

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | 12 e2e test files trong `test/e2e/` |
| Cách dùng | `request(app.getHttpServer()).get('/api/...').expect(200)` |
| Breaking changes có thể | Import syntax có thể đổi từ `* as request` sang default import |

```bash
npm install supertest@latest @types/supertest@latest --save-dev
```

**Verify:**

```bash
npm run test:e2e
```

**Lưu ý:** Nếu import lỗi, đổi từ `import * as request from 'supertest'` sang `import request from 'supertest'`.

---

### 2d. nodemailer 6 → 8 + @types/nodemailer 7 → 8

**Rủi ro: TRUNG BÌNH**

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | `src/core/mail/mail-transporter.helper.ts`, `src/core/mail/mail.service.ts` |
| API sử dụng | `nodemailer.createTransport()`, `transporter.sendMail()`, `pool: true`, TLS config |
| Breaking changes có thể | Transport options, pool config, TLS handling, `sendMail()` return type |

**Chi tiết rủi ro:**
- `pool: true` — cần verify vẫn được support
- `requireTLS: true` + `tls: { rejectUnauthorized: false }` cho port 587 — TLS config có thể thay đổi
- `Transporter` type import có thể đổi đường dẫn

```bash
npm install nodemailer@latest @types/nodemailer@latest
```

**Verify:**
1. `npm run build` — không lỗi TypeScript
2. Test gửi email thật qua SMTP
3. Kiểm tra email pooling hoạt động

---

### 2e. rate-limiter-flexible 5 → 11

**Rủi ro: THẤP (thực tế)**

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | `src/bootstrap/rate-limit.ts` (duy nhất) |
| Cách dùng | `RateLimiterMemory` + `consume()` |
| Trạng thái | **DEAD CODE** — function `applyRateLimiting()` tồn tại nhưng KHÔNG được gọi trong `main.ts` |

**Khuyến nghị:** Có 2 lựa chọn:
1. Nâng cấp bình thường nếu dự định dùng trong tương lai
2. Xóa luôn package nếu không cần (giảm bundle size)

```bash
# Option 1: Nâng cấp
npm install rate-limiter-flexible@latest

# Option 2: Xóa
npm uninstall rate-limiter-flexible
rm src/bootstrap/rate-limit.ts
```

**Verify:** `npm run build`

---

### 2f. class-validator 0.14 → 0.15

**Rủi ro: TRUNG BÌNH-CAO** — Ảnh hưởng rộng nhất trong Phase 2.

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | **65 files** import decorators, **82 DTO files** |
| Decorators sử dụng | `@IsNotEmpty`, `@IsString`, `@IsEmail`, `@IsOptional`, `@IsArray`, `@IsInt`, `@IsBoolean`, `@IsEnum`, `@IsUrl`, `@MaxLength`, `@MinLength`, `@Min`, `@Max`, `@ValidateNested`, `@ValidateIf`, `@IsDateString` |
| Custom validators | `src/common/shared/decorators/is-primary-key.decorator.ts` (UUID, ObjectId, BigInt), `src/common/shared/validators/match.decorator.ts` (field comparison) |
| Validation pipe | `src/bootstrap/pipes.ts` — global `ValidationPipe` |

**Chi tiết rủi ro:**
- Nếu decorator API thay đổi → validation lỗi toàn bộ API endpoints
- Custom validators dùng internal API (`registerDecorator`, `ValidatorConstraint`) — rủi ro breaking
- `ValidationPipe` options có thể thay đổi behavior

```bash
npm install class-validator@latest
```

**Verify (BẮT BUỘC tất cả):**
1. `npm run build` — không lỗi TypeScript
2. `npm test` — 97 unit tests pass
3. `npm run test:e2e` — 12 e2e tests pass
4. Test manual: tạo user, login, tạo comic, submit form — verify validation messages

**Rollback nhanh:** `npm install class-validator@0.14.4`

---

### 2g. reflect-metadata 0.1 → 0.2

**Rủi ro: TRUNG BÌNH** — Core của TypeScript decorator system.

| Thông tin | Chi tiết |
|-----------|----------|
| Files ảnh hưởng | `src/main.ts`, `src/core/database/cli/seed.ts`, `src/core/database/cli/drop-database.ts`, `src/core/database/cli/create-database.ts` |
| Vai trò | Enable decorator metadata cho toàn bộ NestJS DI system |

**CHỈ nâng cùng Phase 4 (NestJS 10→11)** để đảm bảo compatibility. Không nâng riêng lẻ.

---

## Phase 3: ESLint ecosystem

**Rủi ro: TRUNG BÌNH** | Chỉ ảnh hưởng developer experience, không ảnh hưởng production.

| Package | Current | Target |
|---------|---------|--------|
| eslint | 8.57.1 | 10.x |
| @typescript-eslint/eslint-plugin | 6.21.0 | 8.x |
| @typescript-eslint/parser | 6.21.0 | 8.x |
| eslint-config-prettier | 9.1.2 | 10.x |

### Breaking change: Flat Config

ESLint 9+ bỏ `.eslintrc.*`, chuyển sang **flat config** (`eslint.config.mjs`).

**File cần thay đổi:**
- **Xóa:** `.eslintrc.js`
- **Tạo mới:** `eslint.config.mjs`

**Config hiện tại cần migrate:**

```js
// .eslintrc.js (CŨ - sẽ bị xóa)
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json', tsconfigRootDir: __dirname, sourceType: 'module' },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

```js
// eslint.config.mjs (MỚI - flat config)
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
```

### Thực hiện

```bash
npm install eslint@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest eslint-config-prettier@latest --save-dev
```

Sau đó xóa `.eslintrc.js`, tạo `eslint.config.mjs` như trên.

**Verify:** `npx eslint .`

---

## Phase 4: NestJS 10 → 11

**Rủi ro: CAO** — Thay đổi lớn nhất. Tạo branch riêng bắt buộc.

### Packages nâng đồng thời (KHÔNG được nâng riêng lẻ)

| Package | Current | Target | Ghi chú |
|---------|---------|--------|---------|
| @nestjs/common | 10.4.22 | 11.x | Core |
| @nestjs/core | 10.4.22 | 11.x | Core |
| @nestjs/platform-express | 10.4.22 | 11.x | Express adapter |
| @nestjs/cli | 10.4.9 | 11.x | Build tool |
| @nestjs/schematics | 10.2.3 | 11.x | Code generation |
| @nestjs/testing | 10.4.22 | 11.x | Test utilities |
| @nestjs/config | 3.3.0 | 4.x | Configuration |
| @nestjs/swagger | 7.4.2 | 11.x | API docs |
| @types/express | 4.17.25 | 5.x | Express types |
| reflect-metadata | 0.1.14 | 0.2.x | Decorator metadata |

### Lệnh cài đặt

```bash
npm install @nestjs/common@latest @nestjs/core@latest @nestjs/platform-express@latest @nestjs/config@latest @nestjs/swagger@latest reflect-metadata@latest @types/express@latest
npm install @nestjs/cli@latest @nestjs/schematics@latest @nestjs/testing@latest --save-dev
```

### Phân tích rủi ro chi tiết

#### R1. Express v4 → v5 (Rủi ro: CAO)

NestJS 11 có thể dùng Express 5 adapter. Ảnh hưởng:

| File | Vấn đề |
|------|--------|
| `src/main.ts` (130 dòng) | `NestFactory.create<NestExpressApplication>()`, trust proxy, static assets |
| `src/common/http/middlewares/request-context.middleware.ts` | `req.ip`, `req.headers`, `req.socket.remoteAddress` |
| `src/common/http/middlewares/group-context.middleware.ts` | Request header extraction |
| `src/bootstrap/http-hardening.ts` | `app.use(helmet())`, `app.use(hpp())`, `app.use(compression())` |
| `src/bootstrap/static-assets.ts` | `app.useStaticAssets()`, custom CORS middleware |
| `src/bootstrap/rate-limit.ts` | Express middleware pattern (dead code) |

**Kiểm tra cần làm:**
- `req.ip` behavior có thay đổi không (Express 5 thay đổi cách parse IP)
- `app.useStaticAssets()` API có giữ nguyên không
- Middleware `(req, res, next)` signature có thay đổi không

#### R2. @nestjs/swagger 7 → 11 (Rủi ro: TRUNG BÌNH)

17 files sử dụng Swagger decorators:

| Khu vực | Files |
|---------|-------|
| Setup | `src/main.ts` — `DocumentBuilder`, `SwaggerModule.createDocument()` |
| Controllers | User admin, profile, auth, và các module khác |
| DTOs | User, auth, và related DTOs |

**Kiểm tra:** Swagger UI (`/api/docs`) hiển thị đúng sau upgrade.

#### R3. @nestjs/config 3 → 4 (Rủi ro: TRUNG BÌNH)

27+ files inject `ConfigService`. Pattern sử dụng:

```typescript
// Pattern phổ biến trong project
const value = this.configService.get<string>('key', 'default');
const port = this.configService.get<number>('app.port', 3000);
```

**Kiểm tra:** `ConfigService.get()` type signature, `ConfigModule.forRoot()` options.

#### R4. Các @nestjs/* packages khác (Rủi ro: TRUNG BÌNH)

| Package | Dùng ở | Kiểm tra |
|---------|--------|----------|
| @nestjs/cache-manager | `src/common/cache/services/cache.service.ts` | `CACHE_MANAGER` token, `get/set/del/clear` methods |
| @nestjs/bull | `src/core/queue/queue.module.ts` | `BullModule.forRootAsync()`, `@Processor`, `@Process` decorators |
| @nestjs/jwt | `src/modules/core/auth/auth.module.ts` | `JwtModule.registerAsync()`, `JwtService.sign/verify` |
| @nestjs/passport | `src/modules/core/auth/strategies/` | `PassportStrategy()`, `AuthGuard()` |

### Files cần review/sửa (thứ tự ưu tiên)

1. **`src/main.ts`** — Bootstrap, middleware, Swagger setup
2. **`src/app.module.ts`** — Middleware consumer `.forRoutes('*')`
3. **`src/core/core.module.ts`** — ConfigModule, CacheModule, QueueModule
4. **`src/core/queue/queue.module.ts`** — Bull + Redis config
5. **`src/modules/core/auth/auth.module.ts`** — JWT + Passport
6. **`src/modules/core/auth/strategies/*.ts`** — JWT strategy, Google OAuth strategy
7. **`nest-cli.json`** — Compiler options, collection
8. **17 files Swagger** — Decorators, DTO annotations

### Verify (BẮT BUỘC tất cả)

```bash
# 1. Build
npm run build

# 2. Unit tests
npm test

# 3. E2E tests
npm run test:e2e

# 4. Manual verification
npm run start:dev
```

Kiểm tra manual:
- [ ] App khởi động không lỗi
- [ ] Swagger UI accessible tại `/api/docs`
- [ ] Login/Register hoạt động
- [ ] JWT refresh token hoạt động
- [ ] Google OAuth redirect đúng
- [ ] Email gửi được
- [ ] Redis cache hoạt động
- [ ] Bull queue xử lý notification job
- [ ] Static files serve đúng

---

## Phase 5: TypeScript + Jest

### 5a. TypeScript 5 → 6

**Rủi ro: CAO**

| Thông tin | Chi tiết |
|-----------|----------|
| tsconfig target | ES2021 |
| Module system | commonjs |
| Strict mode | enabled |
| Decorators | experimentalDecorators + emitDecoratorMetadata |

**Breaking changes có thể:**
- Strict type-checking rules mới → build lỗi
- Decorator behavior thay đổi (TS5 dùng `experimentalDecorators`, TS6 có thể prefer TC39 decorators)
- Module resolution thay đổi

**Khuyến nghị:** Nâng SAU NestJS 11, confirm NestJS 11 officially support TS6.

```bash
npm install typescript@latest --save-dev
```

**Verify:** `npm run build` — fix tất cả TypeScript errors mới.

### 5b. Jest 29 → 30 + @types/jest 29 → 30

**Rủi ro: CAO — CHƯA KHẢ THI**

| Vấn đề | Chi tiết |
|---------|----------|
| Blocker | `ts-jest` 29.x **KHÔNG tương thích** Jest 30 |
| Test files | 110 files (97 unit + 12 e2e + 1 e2e config) |
| Config | Jest config trong `package.json` |

**Khuyến nghị: HOÃN** cho đến khi `ts-jest` release version tương thích Jest 30.

---

## Ma trận rủi ro tổng hợp

```
               Effort thấp          Effort cao
            ┌─────────────────┬─────────────────┐
Rủi ro thấp │ Phase 1         │                 │
            │ helmet, joi     │                 │
            │ supertest       │                 │
            │ rate-limiter    │                 │
            ├─────────────────┼─────────────────┤
Rủi ro TB   │ ESLint (Phase 3)│ nodemailer      │
            │                 │ class-validator │
            ├─────────────────┼─────────────────┤
Rủi ro cao  │                 │ NestJS 11 (P4)  │
            │                 │ TypeScript 6    │
            │                 │ Jest 30 (HOÃN)  │
            └─────────────────┴─────────────────┘
```

## Thứ tự thực hiện khuyến nghị

| Bước | Phase | Thời điểm | Branch |
|:----:|:-----:|-----------|--------|
| 1 | Phase 1 (patch/minor) | Làm ngay | `master` |
| 2 | Phase 2a-c (helmet, joi, supertest) | Làm ngay | `master` |
| 3 | Phase 2d (nodemailer) | Tuần này | `upgrade/nodemailer-v8` |
| 4 | Phase 2e (rate-limiter) | Tuần này | `master` (hoặc xóa) |
| 5 | Phase 2f (class-validator) | Tuần này | `upgrade/class-validator-v015` |
| 6 | Phase 3 (ESLint) | Tuần sau | `upgrade/eslint-v10` |
| 7 | Phase 4 (NestJS 11) | Khi sẵn sàng | `upgrade/nestjs-v11` |
| 8 | Phase 5a (TypeScript 6) | Sau NestJS 11 | `upgrade/typescript-v6` |
| 9 | Phase 5b (Jest 30) | Khi ts-jest support | HOÃN |

## Checklist verification cuối cùng

Sau khi hoàn thành tất cả phases:

- [ ] `npm run build` thành công, không warning mới
- [ ] `npm run lint` pass
- [ ] `npm test` — 97 unit tests pass
- [ ] `npm run test:e2e` — 12 e2e tests pass
- [ ] `npm run start:dev` — app khởi động
- [ ] Swagger UI truy cập được (`/api/docs`)
- [ ] Auth flow: login, register, JWT refresh, Google OAuth
- [ ] Email: gửi thành công qua SMTP
- [ ] Cache: Redis get/set/del hoạt động
- [ ] Queue: Bull notification job được xử lý
- [ ] Static assets: serve files đúng CORS headers
- [ ] Docker: `docker build` thành công
- [ ] `npm audit` — không có vulnerability mới critical/high
