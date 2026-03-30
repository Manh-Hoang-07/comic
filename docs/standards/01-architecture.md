# Quy Tắc Kiến Trúc (3-Tier Architecture)

Tài liệu này định nghĩa các lớp cốt lõi trong hệ thống: **Controller, Service và Repository**.

---

## 1. Controller Layer (`*.controller.ts`)

**Nhiệm vụ chính:** Đóng vai trò như một "lễ tân". Nó là điểm tiếp nhận các Request từ phía Client, kiểm tra tính đầy đủ/hợp lệ của Request, rồi giao việc cho Service, cuối cùng là trả kết quả (Response) lại cho Client.

**✅ NHỮNG ĐIỀU NÊN/CẦN LÀM:**
- **Định tuyến (Routing):** Khai báo các endpoint, HTTP methods (`@Get()`, `@Post()`, `@Put()`, `@Delete()`).
- **Xác thực & Phân quyền (Auth/Guards):** Chặn các request không hợp lệ ngay từ cửa (ví dụ dùng `@UseGuards()`).
- **Kiểm duyệt dữ liệu đầu vào (Validation):** Sử dụng các DTO (Data Transfer Objects) để đảm bảo dữ liệu client gửi lên là đúng format (ví dụ dùng `class-validator`).
- **Ủy quyền xử lý (Delegation):** Truyền dữ liệu xuống **Service Layer** để xử lý.
- **Phản hồi chuẩn:** Chỉ gọi và `return` trực tiếp kết quả từ Service.

**❌ NHỮNG ĐIỀU KHÔNG ĐƯỢC LÀM:**
- **KHÔNG** chứa Business Logic (logic nghiệp vụ).
- **KHÔNG** tương tác trực tiếp (query) với Database, ORM hoặc gọi sang Repository.
- **KHÔNG** tự bọc dữ liệu thành `{ success: true, data: ... }` (việc này để Interceptor lo).

*Ví dụ chuẩn (Sạch & Gọn):*
```typescript
@Post('register')
async registerUser(@Body() registerDto: RegisterDto) {
  // Controller CHỈ làm nhiệm vụ điều phối
  return this.authService.register(registerDto);
}
```

---

## 2. Service Layer (`*.service.ts`)

**Nhiệm vụ chính:** Đóng vai trò là "Bếp trưởng". Chứa đựng toàn bộ bộ não, quy trình tính toán xử lý dữ liệu và logic nghiệp vụ lõi (Business Logic).

**✅ NHỮNG ĐIỀU NÊN/CẦN LÀM:**
- **Xử lý Business Logic:** Kiểm tra các điều kiện (VD: *User này có đủ tiền thanh toán không?, Số điện thoại này đã đăng ký chưa?*).
- **Tái sử dụng (Reusable):** Các service phải độc lập để có thể được gọi chéo.
- **Tương tác với DB qua Repository:** Sau khi tính toán xong, gọi xuống **Repository Layer** để lưu dữ liệu.
- **Giao tiếp External API:** Gọi sang các dịch vụ bên ngoài (Payment gateway, Send mail...).
- **Bắn lỗi Nghiệp vụ (Throw Exceptions):** Nếu logic sai, chủ động throw các exception (VD: `BadRequestException('Email đã tồn tại')`).

**❌ NHỮNG ĐIỀU KHÔNG ĐƯỢC LÀM:**
- **KHÔNG** dính dáng đến các Request hay Response objects của HTTP. Service phải chạy được bất kể nó được gọi từ API, hay gọi ngầm qua Cronjob.
- **KHÔNG** viết những truy vấn DB quá trần trụi hoặc quá phức tạp ở đây (việc đó để Repository lo).

---

## 3. Repository Layer (`*.repository.ts`)

**Nhiệm vụ chính:** Đóng vai trò là "Thủ quỹ/Thủ kho". Đây là nơi duy nhất giao tiếp trực tiếp với cơ sở dữ liệu (Database).

**✅ NHỮNG ĐIỀU NÊN/CẦN LÀM:**
- **Các thao tác nội bộ Data:** Cung cấp các hàm tạo, lấy, cập nhật, xóa dữ liệu (CRUD).
- **Queries phức tạp:** Nơi chứa các câu tính toán Join, Aggregate, Filter phức tạp bằng Prisma/TypeORM.

**❌ NHỮNG ĐIỀU KHÔNG ĐƯỢC LÀM:**
- **KHÔNG** xử lý logic nghiệp vụ. Chỉ tập trung thực thi chính xác yêu cầu truy xuất dữ liệu.
- **KHÔNG** quăng HTTP Exceptions (400, 404) ở layer này.

---

## 🔄 Luồng Đi Của Một Request

1. `Client` ➡️ gửi Request.
2. `Controller` ➡️ Kiểm tra vé (Auth), kiểm tra hành lý (Validate DTO). Nếu OK, đưa data cho Service.
3. `Service` ➡️ Tính toán cặn kẽ (Business Logic). Khi cần số liệu, nó gọi Repository.
4. `Repository` ➡️ Chạy xuống cái kho (Database) lấy đúng cục dữ liệu đó lên rồi giao lại cho Service.
5. `Service` ➡️ Nhận data thô, tính toán nốt rồi ném kết quả về cho Controller.
6. `Interceptor` (Tự động) ➡️ Gom kết quả, dán nhãn đẹp đẽ và gửi về cho Client (200/201 OK).
