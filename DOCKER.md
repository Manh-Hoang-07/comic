## Chạy backend bằng Docker

Hướng dẫn này dùng cho project NestJS này với MariaDB + Redis chạy trong Docker.

### 1. Chuẩn bị file môi trường

- **Local (chạy lệnh `npm` trên máy)**  
  Tạo/kiểm tra file `.env`:

  - DB trong Docker được map port: `3307:3306`, nên trên **Windows** kết nối qua:
    - `DB_HOST=localhost`
    - `DB_PORT=3307`
    - `DATABASE_URL=mysql://root:root@localhost:3307/gioithieu?connection_limit=50`

- **Docker (các container tự nói chuyện với nhau)**  
  Tạo file `.env.docker` từ `.env.docker.example`:

  ```bash
  cp .env.docker.example .env.docker
  ```

  Đảm bảo các giá trị chính xác:

  - Database:
    - `DB_HOST=db`
    - `DB_PORT=3306`
    - `DB_USERNAME=root`
    - `DB_PASSWORD=root`
    - `DB_DATABASE=gioithieu`
    - `DATABASE_URL=mysql://root:root@db:3306/gioithieu?connection_limit=50`
  - Redis:
    - `REDIS_URL=redis://redis:6379`
  - Các biến khác (JWT, STORAGE, GOOGLE_*, ENCRYPTION_KEY, …) có thể lấy luôn từ file example.

### 2. Khởi động stack Docker (DB + Redis + API)

Trong thư mục project `d:\comic`:

```bash
docker compose --env-file .env.docker up -d --build
```

Lệnh này sẽ:

- build image API (NestJS)
- chạy 3 container:
  - `comic-db` (MariaDB)
  - `comic-redis` (Redis)
  - `comic-api` (NestJS backend)

Kiểm tra trạng thái:

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs api
```

### 3. Khởi tạo schema database bằng Prisma

Prisma trong project này dùng `db push` (không có migrations).  
Sau khi containers chạy, thực hiện:

```bash
docker compose --env-file .env.docker exec api npx prisma db push
```

Điều này sẽ tạo toàn bộ bảng (table) theo `prisma/schema.prisma` trong database `gioithieu` trên container `comic-db`.

### 4. Seed dữ liệu mẫu (chạy trên máy host)

Script seed được viết bằng TypeScript (`ts-node`), nên chạy **trên máy** (không phải trong container) và kết nối vào DB Docker qua port 3307.

Đảm bảo trong `.env`:

- `DB_HOST=localhost`
- `DB_PORT=3307`
- `DB_USERNAME=root`
- `DB_PASSWORD=root`
- `DB_DATABASE=gioithieu`
- `DATABASE_URL=mysql://root:root@localhost:3307/gioithieu?connection_limit=50`

Sau đó chạy:

```bash
npm run seed
```

Nếu thành công, database trong Docker sẽ có đầy đủ dữ liệu mẫu (users, comics, v.v.).

### 5. Truy cập API

API container map port:

- **Host URL**: `http://127.0.0.1:8000`
- Global prefix: `/api`

Ví dụ:

- Trang chủ public: `http://127.0.0.1:8000/api/public/homepage`

### 6. Dừng và xóa containers

Để dừng stack:

```bash
docker compose --env-file .env.docker down
```

Để dừng nhưng giữ lại dữ liệu DB (volume `db_data`) thì chỉ cần `down` như trên. Nếu muốn xóa luôn dữ liệu:

```bash
docker compose --env-file .env.docker down -v
```

