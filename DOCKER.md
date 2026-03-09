## Quick Start với Docker (Supabase + Upstash)

### 1. Khởi động hệ thống
Lệnh này sẽ build image và chạy container ở chế độ chạy ngầm:
```bash
docker compose --env-file .env.docker up -d --build
```

### 2. Xem Log ứng dụng
Sử dụng lệnh này để theo dõi quá trình khởi động hoặc debug lỗi:
```bash
docker compose --env-file .env.docker logs -f api
```

### 3. Cập nhật cấu hình Database (Prisma)
Chạy lệnh này khi bạn có thay đổi trong file `prisma/schema.prisma` và muốn đồng bộ lên Supabase:
```bash
docker compose --env-file .env.docker exec api npx prisma db push
```

### 4. Dừng hệ thống
Dừng container khi không sử dụng:
```bash
docker compose --env-file .env.docker down
```

---
*Lưu ý: Đảm bảo bạn đã cấu hình đầy đủ `DATABASE_URL`, `DIRECT_URL` và `REDIS_URL` trong file `.env.docker` trước khi chạy.*
