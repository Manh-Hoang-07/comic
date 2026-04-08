# Tai lieu tich hop phan quyen (FE)

Tai lieu nay tong hop cac API phuc vu man hinh phan quyen va gan quyen cho FE.

## 1) Quy uoc chung

- Base URL: `/api`
- Authorization: `Bearer <access_token>`
- Header context (khi thao tac theo group): `x-group-id: <group_id>`
- Dinh dang response list (tu BaseService):
  - `data`: mang ban ghi
  - `meta`: thong tin phan trang (`page`, `limit`, `total`, ...)

## 2) Man hinh va truong can hien thi

## 2.1 Man hinh danh sach user + modal phan quyen theo tung tai khoan

### API lay du lieu

- `GET /api/admin/users`
- Filter thuong dung:
  - `search`
  - `status`
  - `groupId`
  - `page`, `limit`, `sort`

### Truong FE hien thi (theo repository hien tai)

- `id`
- `email`
- `phone`
- `username`
- `name`
- `image`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

### Thiet ke modal phan quyen (theo user)

- Moi dong user co nut `Phan quyen`.
- Khi mo modal, FE truyen dau vao:
  - `userId` (bat buoc): id nguoi dung dang duoc phan quyen
  - `groupId` (nen co): group dang thao tac
- Modal nen hien thi:
  - Thong tin user co ban: `id`, `name`, `email`, `status`
  - Danh sach role dang duoc gan trong group hien tai
  - Danh sach role co the chon (multi-select)

### API lay vai tro user theo group (de do vao modal)

- `GET /api/admin/users/:id/roles?groupIds=<id1,id2>`
- Tra ve tung dong gan role:
  - `group_id`
  - `role_id`
  - `group_code`
  - `group_name`
  - `role_code`
  - `role_name`

Goi y cho modal theo 1 group:
- Neu modal dang o group `10` thi goi: `GET /api/admin/users/:userId/roles?groupIds=10`

## 2.2 Man hinh danh sach role

### API lay du lieu

- `GET /api/admin/roles`
- `GET /api/admin/roles/simple` (dropdown)
- `GET /api/admin/roles/:id` (chi tiet role)

### Truong FE hien thi

- `id`
- `code`
- `name`
- `status`
- `parent_id`
- `created_at`
- `updated_at`
- `parent` (id, code, name, status)
- `children` (id, code, name, status)
- `permissions` (danh sach permission cua role)
- `context_ids`
- `contexts`

## 2.3 Man hinh danh sach permission

### API lay du lieu

- `GET /api/admin/permissions`
- `GET /api/admin/permissions/simple` (dropdown)
- `GET /api/admin/permissions/:id` (chi tiet)

### Truong FE hien thi

- `id`
- `code`
- `name`
- `status`
- `scope`
- `parent_id`
- `created_at`
- `updated_at`
- `parent` (id, code, name, status)
- `children` (id, code, name, status)

## 2.4 Man hinh chon group/context truoc khi gan quyen

### API lay group

- `GET /api/admin/groups`
- `GET /api/admin/groups/simple`
- `GET /api/user/groups` (group cua user hien tai, co kem roles)

### API lay context

- `GET /api/user/contexts`

### Quy uoc FE theo loai user

- **Super Admin**:
  - Co the chon nhieu group khac nhau de phan quyen cho cung 1 user.
  - FE cho phep chon `groupId` (dropdown hoac tab), va moi lan bam Luu modal se gan role cho cap `(userId, groupId)` hien tai.
- **Group Admin**:
  - Chi duoc thao tac tren group hien tai cua minh.
  - FE nen khoa chon group (chi 1 gia tri), truyen `x-group-id` tu context hien tai va khong cho chon group khac.

## 3) API thao tac phan quyen (quan trong)

## 3.1 Gan role cho user trong group

- Endpoint: `PUT /api/admin/users/:id/roles`
- Permission backend yeu cau: `assignment.manage`
- Body:

```json
{
  "role_ids": ["1", "2", "3"],
  "group_id": "10"
}
```

Luu y:
- API nay la sync, tuc la thay the toan bo role hien tai cua user trong group bang `role_ids` moi.
- `group_id` co the bo qua neu da truyen `x-group-id` header.
- Voi modal theo user:
  - `:id` chinh la `userId` dau vao cua modal.
  - Khi bam Luu, FE gui toan bo role dang tick trong modal.
 - Super Admin:
   - Co the lap qua nhieu group: moi lan chon 1 `groupId` khac va goi PUT voi body tuong ung.
 - Group Admin:
   - Chi goi PUT cho group ma ho dang dang nhap/duoc gan, FE khong cho chon group khac.

## 3.2 Gan permission cho role

- Endpoint: `POST /api/admin/roles/:id/permissions`
- Permission backend yeu cau: `role.manage`
- Body:

```json
{
  "permission_ids": ["101", "102", "103"]
}
```

Luu y:
- API nay cung la sync: role se duoc thay bo permission hien tai bang danh sach moi.

## 3.3 Tao/sua/xoa role

- `POST /api/admin/roles`
- `PUT /api/admin/roles/:id`
- `DELETE /api/admin/roles/:id`

Body tao/sua role nen dung cac truong:
- `code`
- `name`
- `status`
- `parent_id` (neu co)
- `context_ids` (mang context id duoc phep)

## 3.4 Tao/sua/xoa permission

- `POST /api/admin/permissions`
- `PUT /api/admin/permissions/:id`
- `DELETE /api/admin/permissions/:id`

Body tao/sua permission nen dung cac truong:
- `code`
- `name`
- `status`
- `scope`
- `parent_id` (neu co)

## 4) De xuat luong FE tich hop nhanh

1. Load dropdown group/context (`/admin/groups/simple` hoac `/user/groups`).
2. Load danh sach user (`/admin/users`).
3. Nhan nut `Phan quyen` tai 1 user -> mo modal, truyen `userId`.
4. Khi modal mo:
   - Goi `/admin/users/:userId/roles?groupIds=<groupId_hien_tai>` de lay role dang gan.
   - Goi `/admin/roles/simple` de lay role co the chon.
5. Bam Luu trong modal:
   - Goi `PUT /admin/users/:userId/roles` voi `role_ids` va `group_id`.
6. O man hinh quan ly role:
   - Goi `/admin/permissions` hoac `/admin/permissions/simple` de chon permission.
   - Goi `POST /admin/roles/:id/permissions` de luu permission cho role.

## 5) Cac permission code FE can dung de an/hien chuc nang

- Xem user: `user.view`
- Tao user: `user.create`
- Sua user: `user.update`
- Xoa user: `user.delete`
- Khoa/mo khoa user: `user.status`
- Quan ly role: `role.manage`
- Quan ly permission: `permission.manage`
- Gan role cho user: `assignment.manage`

## 6) Luu y ky thuat

- Neu thao tac theo group, FE nen gui `x-group-id` de backend resolve dung context.
- Role trong non-system context bi rang buoc theo `context_id`; backend se bao loi neu gan role sai context.
- Swagger de test API: `/api/docs` (non-production).
