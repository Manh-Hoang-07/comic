# Quy Tắc Đặt Tên (Naming Conventions)

Việc đặt tên thống nhất giúp code dễ đọc và dễ tìm kiếm (Search) trong IDE.

---

## 1. Tên File (`kebab-case`)

Tất cả các tên file code phải viết thường, phân tách bằng dấu gạch ngang.
- **Controller:** `auth.controller.ts`, `user-profile.controller.ts`
- **Service:** `auth.service.ts`, `file-upload.service.ts`
- **Module:** `auth.module.ts`
- **DTO:** `create-user.dto.ts`

---

## 2. Tên Class (`PascalCase`)

Tên class phải khớp với tên file nhưng viết theo kiểu PascalCase.
- **Controller:** `class AuthController { ... }`
- **Service:** `class UserProfileService { ... }`
- **DTO:** `class CreateUserDto { ... }`

---

## 3. Hàm & Biến (`camelCase`)

Tất cả các hàm, biến và các properties trong object/class phải bắt đầu bằng chữ thường.
- **Function:** `getUserById()`, `calculateTotalAmount()`
- **Variable:** `userData`, `isActive`, `latestPosts`

---

## 4. Quy Tắc Số Nhiều / Số Ít

- **Bảng Database (Entity):** Luôn dùng **số ít** (VD: `user`, `comic`, `category`).
- **Danh sách dữ liệu trong code:** Dùng **số nhiều** (VD: `users`, `comics`, `items`).
- **Endpoint API (URL):** Ưu tiên **số nhiều** (VD: `GET /users`, `GET /categories`).
