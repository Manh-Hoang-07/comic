# Kế hoạch tối ưu tốc độ (backend NestJS + Prisma + Redis)

> **Mục tiêu:** Giảm độ trễ perceived latency cho API (đặc biệt khi application cache miss và DB/Redis ở xa), giảm round-trip mạng, query DB trùng, và **giảm số request tới origin** nhờ HTTP/CDN.  
> **Tham chiếu thêm:** `docs/performance-audit.md`, các phân tích đã làm trên repo `comic`.

---

## Nguyên tắc Redis (tránh over-engineering)

| Thứ tự ưu tiên | Công cụ | Khi nào dùng |
|----------------|---------|----------------|
| 1 | **MGET** / lệnh đơn gộp được sẵn | Giảm round-trip mà không thêm complexity (đã áp dụng một phần cho throttler). |
| 2 | **Pipeline** (gom nhiều lệnh, vẫn từng lệnh độc lập) | Giảm RTT khi có chuỗi `GET`/`SET`/`DEL` tuần tự. |
| 3 | **Lua script** | **Chỉ P2 / sau khi đo:** cần **atomic** đa bước, **hoặc** đã có số liệu chứng minh pipeline vẫn là bottleneck. |

**Lua:** khó debug và maintain hơn; **không** đưa vào P0. Chỉ cân nhắc khi có nhu cầu atomic thật hoặc benchmark rõ ràng.

---

## 1. Đo lường trước khi sửa (bắt buộc)

| Việc | Chi tiết |
|------|----------|
| Baseline P50/P95 | Đo vài endpoint đại diện: public comic/post, menu user (có JWT), `general-config` (hit/miss cache). |
| Phân tách thời gian | Logging có điều kiện (dev) hoặc OpenTelemetry: guard, interceptor, handler, Redis/DB. |
| Môi trường | Ghi rõ: DB Supabase region, Redis (Upstash vs local), có/không Bearer token, có/không `x-group-id`. |

**Tiêu chí thành công (gợi ý):** cùng endpoint, cùng payload — ví dụ giảm P95 sau tối ưu ≥ 40% hoặc giảm tải origin (RPS tới app) nhờ CDN như mục 2.

---

## 2. Ưu tiên P0 — Tác động lớn, ít rủi ro

### 2.1 HTTP caching (CDN / browser) — **thiếu sót lớn nếu bỏ qua**

Đây thường là cách **giảm latency và tải origin mạnh nhất** cho nội dung **public, ít thay đổi** (có thể tiệm cận **80–90%** request không cần chạm tới Nest nếu cấu hình đúng).

| Hạng mục | Việc làm |
|----------|----------|
| **Cache-Control** | Trên response API public (hoặc qua reverse proxy): `public, max-age=…`, `s-maxage` cho CDN; tách route **không cache** (auth, cá nhân hóa). |
| **ETag / If-None-Match** | Cho resource có phiên bản rõ (vd. slug + `updated_at`); client/CDN gửi `304` → giảm body và CPU. |
| **CDN (vd. Cloudflare)** | Cache theo URL + query chuẩn hóa; rule bypass cookie/token cho API private; HTTPS, HTTP/2. |
| **Đồng bộ với app cache** | Khi admin sửa nội dung: purge CDN tag/URL hoặc TTL ngắn hợp lý để không serve stale quá lâu. |

**Lưu ý:** API có **Authorization** hoặc **CORS credentials** thường **không** cache chung trên CDN theo URL đơn giản — ưu tiên CDN cho **GET public** không nhạy cảm.

### 2.2 Loại bỏ query DB trùng (đã xác định trong code)

| Vị trí | Vấn đề | Hướng xử lý |
|--------|--------|-------------|
| `src/modules/comics/comic/public/services/comic.service.ts` — `getBySlug` | `findOne` theo slug rồi `getOne(id)` → load comic **hai lần** | Sau `findOne`, `transform` + `afterGetOne` trực tiếp (hoặc `getOneByEntity`), **không** `findById` lại. |
| `src/modules/post/post/public/services/post.service.ts` — `getOneBySlug` | `findPublishedBySlug` → `incrementViewCount` → `findPublishedBySlug` **lần nữa** | Với view buffer Redis, lần đọc thứ hai thường không đổi stats ngay — trả về bản đã load + `transform` (hoặc chỉ refresh khi không dùng buffer). |

**Kiểm thử:** contract API không đổi; so sánh body (đặc biệt `stats` / view count).

### 2.3 Redis trên đường nóng (MGET → pipeline; **không** Lua ở P0)

| Vị trí | Việc | Ghi chú |
|--------|------|---------|
| `src/core/security/redis-throttler-storage.service.ts` | Đã có **MGET**. Bước tiếp: **pipeline** cho các lệnh còn lại trong cùng nhịp xử lý nếu sau đo vẫn thấy RTT Redis đáng kể. | **Lua:** chỉ khi cần atomic |
| `src/modules/core/rbac/services/rbac-cache.service.ts` — `setPermissions` | **Pipeline:** `DEL` + `SADD` + `EXPIRE` (+ publish nếu cần); thêm `expire` chính thức trên `RedisUtil`, bỏ `(redis as any).client`. | |
| `src/modules/core/rbac/services/rbac-cache.service.ts` — `clearAllUserCaches` | **Pipeline** batch `UNLINK`/`DEL`, không `for await` từng key. | |
| `src/modules/core/rbac/services/rbac-cache.service.ts` — `bumpVersion` | Thay `KEYS rbac:*` bằng **SCAN** + xóa batch (hoặc chiến lược version key). | |

### 2.4 Hạ tầng Redis

| Việc | Chi tiết |
|------|----------|
| Cùng region | Redis gần app và Postgres (vd. cùng `ap-southeast-1` nếu Supabase ở đó). |
| Local dev | Redis localhost để tách độ trễ mạng khi debug logic. |

---

## 3. Ưu tiên P1 — JWT, group context (nhẹ, bổ trợ)

| File | Việc |
|------|------|
| `src/modules/core/auth/strategies/jwt.strategy.ts` | Giữ cache Redis profile; TTL + invalidation khi đổi profile; tùy chọn warm sau deploy. |
| `src/modules/core/context/group/admin/services/group.service.ts` — `getOne` | Đã cache Redis 5 phút; có thể kết hợp **ETag / Cache-Control** phía CDN cho dữ liệu ít đổi (xem mục 2.1). |

---

## 4. Ưu tiên P2 — DB, Prisma, Lua (chỉ khi cần)

### 4.1 Redis Lua (chỉ khi đủ điều kiện)

- **Dùng khi:** logic **bắt buộc atomic** nhiều bước trên Redis, **hoặc** đã benchmark: pipeline vẫn không đủ.
- **Không** dùng sớm thay cho MGET/pipeline.

### 4.2 Pool & kết nối

| Việc | Chi tiết |
|------|----------|
| `src/core/database/prisma/prisma.service.ts` | Wire `DB_CONNECTION_LIMIT` (hoặc tương đương) vào `Pool`: `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` phù hợp Supabase pooler. |
| Supabase | Xác nhận `DATABASE_URL` + pooler (`pgbouncer`) khớp transaction mode với Prisma. |

### 4.3 Query & select

| Khu vực | Việc |
|---------|------|
| `MenuService.getUserMenus` + `menu.repository.impl.ts` | Đánh giá full `findAllWithChildren`; cache tree ngắn TTL hoặc giảm include. |
| List có nhiều relation | Rà `select`/`include` — bỏ field nặng (vd. `content`) khỏi list. |

### 4.4 View count — eventual consistency; ưu tiên **chạy ngầm / queue**

| Mục tiêu | Giảm chặn response; chấp nhận **eventual consistency** (số view không critical theo từng request). |
|----------|-----------------------------------------------------------------------------------------------------|

| Cách | Ưu | Nhược |
|------|-----|--------|
| **Fire-and-forget** (`void redis.hincrby(...).catch(...)`) | Đơn giản, không chờ I/O | Có thể **mất vài hit** nếu process crash ngay sau khi gửi; khó quan sát lỗi nếu không log/metric. |
| **Hàng đợi (Bull/BullMQ)** — **khuyến nghị** khi muốn “chạy ngầm” bài bản | Retry, persistence Redis, tách worker; ổn định hơn fire-and-forget thuần | Thêm component + consumer job flush view vào DB/buffer. |
| **Giữ `await` buffer Redis hiện tại** | Gần như không mất hit trong kịch bản bình thường | Vẫn thêm latency = 1 RTT Redis/request. |

**Khuyến nghị ghi trong backlog:** với view không critical — **queue ngầm** flush sang buffer/DB; fire-and-forget chỉ khi chấp nhận rủi ro mất dữ liệu lúc crash và có monitoring.

---

## 5. Ưu tiên P3 — Quan sát & vận hành

- Slow query log / Prisma log có giới hạn (staging).
- Theo dõi connection pool khi tải cao.
- Tài liệu: path “public + token + group header” nặng hơn “public không token”.

---

## 6. Thứ tự thực hiện đề xuất

1. **Đo baseline** (mục 1).  
2. **HTTP: Cache-Control / ETag + CDN** cho GET public phù hợp (mục 2.1) — tác động tổng thể thường lớn nhất.  
3. **Sửa duplicate query** comic/post (mục 2.2).  
4. **Redis: pipeline, SCAN, expire chuẩn** (mục 2.3–2.4) — **không** Lua trừ khi sang bước 6.  
5. **Pool Prisma** + rà select menu/list (mục 4.2–4.3).  
6. **Lua Redis** chỉ khi atomic hoặc đã đo bottleneck (mục 4.1).  
7. **View count:** queue ngầm (ưu tiên) hoặc fire-and-forget có document rủi ro (mục 4.4).

---

## 7. Checklist trước merge

- [ ] Test smoke: public + authenticated.  
- [ ] Không regress: rate limit, refresh token, RBAC khi đổi role.  
- [ ] CDN: verify purge/TTL khi admin cập nhật nội dung cache được.  
- [ ] So sánh P95 và/hoặc hit rate origin trước/sau.

---

*Tài liệu cập nhật theo phản hồi: ưu tiên MGET/pipeline trước Lua; bỏ mục RBAC cold path; làm rõ view count + HTTP/CDN.*
