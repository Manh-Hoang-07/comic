# Quy Tắc Viết Code (Coding Style)

---

## 1. Dependency Injection (DI)

- Không bao giờ dùng `new Class()` thủ công bên trong method.
- Luôn Inject các Service/Repository thông qua `constructor`.
- Điều này giúp code dễ test và lỏng lẻo (loose coupling).

```typescript
// ✅ NÊN
constructor(private readonly userService: UserService) {}

// ❌ KHÔNG NÊN
const userService = new UserService();
```

---

## 2. Môi Trường (Environment Variables)

- Không bao giờ "hardcode" các chuỗi bảo mật, URL, hay key trực tiếp vào code.
- Sử dụng `.env` và truy xuất qua `ConfigService`.

---

## 3. DRY (Don't Repeat Yourself)

- Tránh lặp lại logic. Nếu một đoạn code xuất hiện ở 2 nơi, hãy kéo nó ra thành một hàm dùng chung trong `Helper`, `Utility`, hoặc `SharedService`.

---

## 4. Fail-Fast (Chết sớm)

- Kiểm tra lỗi ngay đầu hàm. Nếu không thỏa mãn điều kiện, hãy `throw` lỗi hoặc `return` ngay lập tức để giảm tải cho logic bên dưới.

```typescript
async handle(data: any) {
  if (!data) throw new BadRequestException('Data is missing'); // Throw ngay lập tức
  
  // Logic phức tạp bên dưới...
}
```

---

## 5. Xử Lý Số Lớn (BigInt)

- Do dự án có thể dùng các ID lớn, hệ thống đã có hàm `deepConvertBigInt` trong `BaseService`. 
- Hãy luôn đảm bảo dữ liệu trả về cho Client được convert từ `BigInt` sang `Number` để tránh lỗi JSON Parser trên trình duyệt.
