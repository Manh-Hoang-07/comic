# k6 load tests

Các script này nhắm vào các endpoint sẵn có trong backend:

- Public browse: `/api/public/homepage`, `/api/public/comics`, `/api/public/chapters/:id/pages`, view tracking
- User journey (optional): login 1 lần ở `setup()` rồi gọi `/api/user/*`

## Cài k6

- Windows: cài k6 theo hướng dẫn chính thức, sau đó đảm bảo lệnh `k6` chạy được trong terminal.

## Chạy smoke test (1 VU)

```powershell
k6 run .\loadtest\k6\smoke.js
```

## Chạy browse load test (public)

```powershell
$env:K6_BASE_URL="http://localhost:8000"
$env:K6_API_PREFIX="/api"
$env:K6_VUS_1="50"
$env:K6_VUS_2="200"
$env:K6_VUS_3="500"
$env:K6_VIEW_TRACK_RATE="0"   # mặc định tắt vì endpoint view bị throttle theo IP

k6 run .\loadtest\k6\public-browse.js
```

## Chạy user journey (cần user/password)

Lưu ý: `/api/login` đang throttle (5 lần/phút/IP). Script này **chỉ login 1 lần trong `setup()`** rồi reuse token.

```powershell
$env:K6_BASE_URL="http://localhost:8000"
$env:K6_API_PREFIX="/api"
$env:K6_EMAIL="user@example.com"
$env:K6_PASSWORD="P@ssw0rd"

k6 run .\loadtest\k6\user-journey.js
```

## Biến môi trường hỗ trợ

- `K6_BASE_URL`: mặc định `http://localhost:8000`
- `K6_API_PREFIX`: mặc định `/api`
- `K6_THINK_MIN_MS`, `K6_THINK_MAX_MS`: think-time giữa các request (mặc định 200–800ms)
- Ramp config:
  - `K6_START_VUS` (mặc định 0)
  - `K6_RAMP_1..4` (mặc định `30s`, `1m`, `2m`, `30s`)
  - `K6_VUS_1..3` (mặc định browse: 50/200/500, user: 10/50/100)

