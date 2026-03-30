# Quy Tắc CRUD & Chuẩn Phản Hồi

Hệ thống sử dụng cơ chế **Global Transform Interceptor** để tự động bọc dữ liệu, giúp Controller cực kỳ sạch sẽ.

---

## 1. Cơ Chế Phản Hồi (Response)

- **Service & Controller:** Chỉ trả về dữ liệu thực (Data).
- **Interceptor:** Tự động "đóng gói" dữ liệu vào format chuẩn của hệ thống:
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-03-30T..."
}
```

---

## 2. Thao Tác CRUD Tiêu Chuẩn

### 2.1. Lấy danh sách (Get List)
- **Controller:** Sử dụng `@Get()`, nhận `@Query()` là một `QueryDto`.
- **Service:** Trả về object chứa `data` và `meta` (phân trang).
- **Kết quả trả về:**
```json
{
  "data": [ ... ],
  "meta": { "total": 100, "page": 1, ... }
}
```

### 2.2. Lấy một bản ghi (Get One)
- **Controller:** Sử dụng `@Get(':id')`, dùng `ParseIntPipe`.
- **Service:** Gọi `repo.findById(id)`. Nếu không thấy, PHẢI `throw new NotFoundException()`.
- **Kết quả trả về:** Trực tiếp Object của bản ghi đó.

### 2.3. Tạo mới (Create)
- **Controller:** `@Post()`, trả về Status Code 201 Created.
- **Service:** Hash mật khẩu (nếu có), validate nghiệp vụ, sau đó gọi `repo.create()`.
- **Kết quả trả về:** Object bản ghi vừa được tạo.

### 2.4. Cập nhật (Update)
- **Controller:** `@Put(':id')` hoặc `@Patch(':id')`.
- **Service:** Kiểm tra tồn tại trước khi cập nhật.
- **Kết quả trả về:** Object bản ghi sau khi đã thay đổi.

### 2.5. Xóa (Delete)
- **Controller:** `@Delete(':id')`.
- **Service:** Gọi `repo.delete()`.
- **Kết quả trả về:** `{ success: true, message: 'Xóa thành công' }` hoặc chính object vừa xóa.

---

## 3. Cấu trúc chi tiết

- **Controller:** Chứa Decorators (`@Controller`, `@Permission`), Constructor (Inject Service), Methods ứng với HTTP Method.
- **Service:** Chứa Business Rules, Data Transformation, External Calls.
- **Repository:** Chứa ORM Instance, Raw/Complex Queries.
