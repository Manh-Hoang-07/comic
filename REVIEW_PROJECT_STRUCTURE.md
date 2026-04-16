# DANH GIA CAU TRUC DU AN - Comic Backend (NestJS)

> Ngay danh gia: 2026-04-17
> Tech stack: NestJS 11 + Prisma 7 + MySQL + Redis + Docker
> Kien truc: DDD (Domain-Driven Design) + Hexagonal Architecture + Repository Pattern

---

## 1. TONG QUAN CAU TRUC THU MUC

```
src/
├── main.ts                    # Entry point
├── app.module.ts              # Root module
├── bootstrap/                 # Cau hinh khoi dong app (8 files)
├── core/                      # Ha tang ky thuat (cache, db, logger, mail, queue, security)
├── common/                    # Cross-cutting concerns (auth, http, file, encryption)
├── modules/                   # Business logic (comic, post, marketing, introduction...)
└── shared/                    # Enums, interfaces dung chung
```

### Danh gia chung: 8/10 - Cau truc tot, co mot so diem can cai thien

---

## 2. DIEM MANH

### 2.1. Phan tang ro rang
- `bootstrap/` - Khoi dong app
- `core/` - Ha tang ky thuat (database, cache, logger, mail, security)
- `common/` - Shared services & cross-cutting concerns
- `modules/` - Business logic theo domain
- `shared/` - Enum registry & shared types

Viec tach `core/` (infrastructure) va `common/` (shared services) la dung chuan, khong bi overlap.

### 2.2. DDD Pattern nhat quan
Moi module deu theo cung mot pattern:
```
module/
├── admin/          # Admin CRUD
│   ├── controllers/
│   ├── services/
│   └── dtos/
├── public/         # Public endpoints (khong can auth)
├── user/           # User endpoints (can auth)
├── domain/         # Repository interface (contract)
└── infrastructure/ # Repository implementation (Prisma)
```
=> Rat de hieu, de maintain, developer moi vao biet ngay code o dau.

### 2.3. Enum Registry thong minh
`src/shared/enums/` co controller + service de expose enum qua REST API, ho tro auto-discovery. Day la thiet ke tot, giup frontend dong bo enum voi backend.

### 2.4. Strategy Pattern cho cache va logger
- Cache: `memory-cache.strategy.ts` + `redis-cache.strategy.ts`
- Logger: `console-log.strategy.ts` + `file-log.strategy.ts` + `logtail-log.strategy.ts`
- Storage: `local-storage.strategy.ts` + `s3-storage.strategy.ts`

=> De mo rong, de test, de swap implementation.

### 2.5. Bootstrap tach rieng tung concern
8 file trong `bootstrap/` moi file mot nhiem vu (cors, rate-limit, logging, shutdown...) thay vi don het vao `main.ts`. Rat clean.

---

## 3. VAN DE CAN XU LY

### 3.1. CRITICAL - Dead code: `slugify` function

**File:** `src/common/shared/utils/string.util.ts`

```typescript
// File nay KHONG DUOC IMPORT o bat ky dau trong project
export function slugify(text: string): string { ... }
```

**Thuc te project dung:** `SlugHelper` (import tu `@/common/core/utils/slug.helper`) va `StringUtil.toSlug()` (import tu `@/core/utils/string.util`).

**De xuat:** Xoa file `src/common/shared/utils/string.util.ts` vi no la dead code. Tat ca 7+ module deu dang dung `SlugHelper.uniqueSlug()`.

---

### 3.2. MEDIUM - Trung lap chuc nang slug giua 2 file

| File | Function | Xu ly Unicode |
|------|----------|---------------|
| `src/core/utils/string.util.ts` | `StringUtil.toSlug()` | KHONG co normalize NFD |
| `src/common/shared/utils/string.util.ts` | `slugify()` | CO normalize NFD (xu ly tieng Viet) |

**Van de:** `StringUtil.toSlug()` dang duoc `SlugHelper` su dung nhung **khong xu ly dau tieng Viet** (thieu `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`). Vi du:
- Input: `"Truyen tranh hay"` => `"truyen-tranh-hay"` (OK)
- Input: `"Truyen tranh hay nhat"` => co the loi voi ky tu dac biet

**De xuat:** Them logic normalize NFD vao `StringUtil.toSlug()` de xu ly dung tieng Viet, roi xoa file `slugify` con lai.

---

### 3.3. MEDIUM - Comics module qua nang (23 imports)

**File:** `src/modules/comics/comic.module.ts`

Hien tai import 23 module + 2 provider trong 1 file. Day la module lon nhat project.

```
ComicsModule imports:
├── 6 Admin modules (comic, chapter, category, comment, review, stats)
├── 4 Public modules (comic, chapter, category, comment, review, stats, homepage)
├── 4 User modules (comment, review, stats, bookmark, follow, reading-history)
├── 4 Repository modules
└── 2 Providers (notification, cron)
```

**De xuat:** Nhom lai thanh sub-aggregate modules:

```typescript
// Truoc:
@Module({
  imports: [
    AdminComicModule, AdminChapterModule, AdminComicCategoryModule,
    AdminCommentsModule, AdminReviewsModule, AdminStatsModule,
    PublicComicsModule, PublicChaptersModule, PublicComicCategoriesModule,
    PublicCommentsModule, PublicReviewsModule, PublicStatsModule,
    UserCommentsModule, UserReviewsModule, UserStatsModule,
    UserBookmarksModule, UserFollowsModule, UserReadingHistoryModule,
    HomepageModule,
    // ... repository modules, providers
  ],
})

// Sau:
@Module({
  imports: [
    ComicAdminAggregateModule,     // Gom 6 admin modules
    ComicPublicAggregateModule,    // Gom 6 public modules
    ComicUserAggregateModule,      // Gom 6 user modules
    ComicRepositoryAggregateModule, // Gom 4 repository modules
  ],
})
```

=> Giam tu 23 imports xuong 4, de doc va de quan ly hon.

---

### 3.4. MEDIUM - Ten trung lap gay nham lan: 2 file `core.module.ts`

| File | Class Name | Muc dich |
|------|-----------|----------|
| `src/core/core.module.ts` | `CoreModule` | Ha tang ky thuat (DB, cache, logger) |
| `src/modules/core/core.module.ts` | `CoreModulesModule` | Business logic (auth, user, RBAC) |

**Van de:** 2 file cung ten `core.module.ts` o 2 thu muc khac nhau, developer moi de nham. Class name `CoreModulesModule` cung kho hieu.

**De xuat:**
- Doi ten `src/modules/core/` thanh `src/modules/system/` hoac `src/modules/platform/`
- Doi class `CoreModulesModule` thanh `SystemModule` hoac `PlatformModule`

```
Truoc: src/modules/core/core.module.ts   => CoreModulesModule
Sau:   src/modules/system/system.module.ts => SystemModule
```

---

### 3.5. LOW - Do sau thu muc (Max 6 levels)

Path dai nhat trong project:
```
src/modules/core/iam/permission/admin/controllers/permission.controller.ts
│    │       │    │      │       │       │
1    2       3    4      5       6       7 (file)
```

**Danh gia:** 6 cap la chap nhan duoc voi DDD + Hexagonal Architecture. Tuy nhien co the giam bot 1 cap bang cach:

```
# Thay vi:
iam/permission/admin/controllers/permission.controller.ts
iam/permission/admin/services/permission.service.ts
iam/permission/admin/dtos/...

```

***Tôi confỉm bỏ thư mục iam nhé

---

### 3.6. LOW - Thu muc `docs/` chua file tieng Viet khong co naming convention - chưa quan tâm nhé

```
docs/
├── context-group-permission-role-cache-plan.md  # English
├── fe-admin-user-roles-api.md                   # English
├── rbac-luong-check-danh-gia.md                 # Tieng Viet
├── rbac-luong-phan-quyen-va-check.md            # Tieng Viet
├── rbac-v2-upgrade-plan.md                      # English
└── user-cached-repository-plan.md               # English
```

**De xuat:** Thong nhat naming convention (nen dung tieng Anh) va nhom theo domain:
```
docs/
├── rbac/
│   ├── rbac-authorization-flow.md
│   ├── rbac-v2-upgrade-plan.md
│   └── rbac-evaluation-flow.md
├── context/
│   └── context-group-permission-cache-plan.md
└── user/
    ├── fe-admin-user-roles-api.md
    └── user-cached-repository-plan.md
```

---

### 3.7. LOW - 2 Homepage controllers co the trung route - chưa quan tâm nhé

| File | Purpose |
|------|---------|
| `src/modules/homepage/controllers/homepage.controller.ts` | Homepage chinh (introduction) |
| `src/modules/comics/homepage/public/controllers/homepage.controller.ts` | Homepage comics |

**De xuat:** Kiem tra lai route prefix cua 2 controller nay dam bao khong bi trung. Nen co route khac biet ro rang, vi du: `/api/homepage` vs `/api/comics/homepage`.

---

## 4. SO SANH CAU TRUC HIEN TAI VS DE XUAT

### 4.1. Cau truc hien tai (Tot)

| Layer | Thu muc | So file | Danh gia |
|-------|---------|---------|----------|
| Bootstrap | `src/bootstrap/` | 8 | Tot |
| Infrastructure | `src/core/` | ~49 | Tot |
| Cross-cutting | `src/common/` | ~78 | Tot |
| Business Logic | `src/modules/` | ~500+ | Tot, can refactor nho |
| Shared Types | `src/shared/` | ~29 | Tot |

### 4.2. Nhung thay doi nen lam (theo thu tu uu tien)

| # | Thay doi | Muc do | Ly do |
|---|---------|--------|-------|
| 1 | Xoa `common/shared/utils/string.util.ts` (dead code) | Nho | Code sach |
| 2 | Them NFD normalize vao `StringUtil.toSlug()` | Nho | Xu ly tieng Viet dung |
| 3 | Doi ten `modules/core/` thanh `modules/system/` | Trung binh | Tranh nham lan |
| 4 | Tach `ComicsModule` thanh sub-aggregates | Trung binh | De doc, de maintain |

---

## 5. KET LUAN

### Diem so tong: 8/10

**Diem manh chinh:**
- Kien truc DDD + Hexagonal duoc ap dung nhat quan xuyen suot
- Phan tang ro rang: bootstrap > core > common > modules > shared
- Strategy pattern cho cache/logger/storage de mo rong
- Enum registry thong minh voi REST API
- Test structure tot (unit + e2e + load test)
- Seed data to chuc sach, khong trung lap

**Diem can cai thien:**
- Dead code can xoa (slugify function)
- Trung lap logic slug can hop nhat
- Comics module qua nang can tach nho
- Naming convention chua nhat quan (core vs core, docs)

**Tong ket:** Du an co cau truc tot, theo dung best practices cua NestJS + DDD. Nhung thay doi de xuat deu la **nice-to-have**, khong co van de blocking nao. Project san sang cho production va de scale them feature moi.
