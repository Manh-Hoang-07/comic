# Kế hoạch xử lý Phân quyền Context Toàn Cục (System Context vs Group Context)

## Vấn đề hiện tại
Bài toán đặt ra không phải là kiểm tra dựa trên Role (Super Admin hay Group Admin), mà mấu chốt nằm ở **Context (Ngữ cảnh)** đang hoạt động của người dùng:
1. **System Context (`context.type === 'system'`):** Có quyền toàn cục. Khi request ở context này, người dùng sẽ thấy dữ liệu của **toàn bộ hệ thống** (all groups) và **CÓ QUYỀN TRUYỀN THAM SỐ ĐỂ LỌC** theo từng group cụ thể.
2. **Group Context (Không phải `system`):** Chỉ có quyền cục bộ. Khi request ở context này (bất kể họ có là Super Admin hay không), mọi dữ liệu đều bị **ép cứng chặt** vào cái `groupId` của context đó. Họ không thể xem hoặc sửa dữ liệu nằm ngoài group của mình.

Bài toán này **không chỉ áp dụng cho User** mà còn cho tất cả các Service khác (Notification, Post, Product...). Thay vì sửa ở từng Service (tạo ra code rác), chúng ta sẽ nâng cấp ở tầng Core (`BaseService` & `Base DTO`).

---

## Phân tích lỗ hổng trong Code
Hàm `getGroupFilter()` hiện tại đang có tham chiếu nhầm tới `isSystemAdmin` để bỏ qua bộ lọc group, điều này khiến cho Super Admin kể cả khi đóng vai (chọn context) Group A vẫn có thể xem được Data hệ thống. **Phải xóa check này đi và thuần túy dùng Context!**

## Giải pháp: Nâng cấp ở tầng Core (`BaseService` & `Base DTO`)

### Bước 1: Sửa lại `getGroupFilter` chuẩn hóa theo Context
Mở file `src/common/shared/utils/group-ownership.util.ts`, sửa lại triệt để:

```typescript
export function getGroupFilter(currentFilter?: any): { group_id?: any; groupId?: any } {
  const context = RequestContext.get<any>('context');
  const groupId = RequestContext.get<any>('groupId');

  // 1. NGỮ CẢNH TOÀN CỤC (System) -> Không ép filter group_id. Trả về rỗng để BaseService tự lấy filter từ DTO.
  if (context?.type === 'system') {
    return {};
  }

  // 2. NGỮ CẢNH CỤC BỘ (Group) -> Ép chặt vào groupId hiện hành! Chặn mọi nỗ lực override filter!
  return groupId ? { group_id: groupId, groupId } : {};
}
```

### Bước 2: Chuẩn hóa DTO lọc danh sách (Tạo `BaseQueryDto`)
Tạo một DTO gốc dùng chung để nhận biến `groupId` từ phía Client gửi lên (nhằm phục vụ cho **System Context** lọc dữ liệu):

```typescript
// src/common/core/dtos/base-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseQueryDto {
  @ApiPropertyOptional({ description: 'Lọc theo nhóm (Chỉ có tác dụng với System Context)' })
  @IsOptional()
  @IsString()
  groupId?: string;

  // Lấy lại các biến phân trang... page, limit...
}
```
**=> Áp dụng:** Các file DTO (như `UserQueryDto`) chỉ cần `extends BaseQueryDto`. Khi `System Context` gửi `?groupId=xxx`, nó sẽ lọt vào filter tự nhiên. Với trường hợp `Group Context`, dù client có gửi `?groupId=xxx` thì hàm `getGroupFilter()` sẽ luôn ghi đè lại bằng `groupId` chuẩn của Context.

### Bước 3: Tự động hóa bộ lọc Danh sách trong `BaseService`
Giúp mọi hàm `getList` của mọi Service tự động tuân thủ theo filter ở Bước 1.

```typescript
  // src/common/core/services/base.service.ts
  import { getGroupFilter } from '@/common/shared/utils/group-ownership.util';

  // Sửa đổi phương thức prepareFilters mặc định
  protected async prepareFilters(filters?: Record<string, any>, _options?: any) {
      // Gọi group filter và gộp thẳng vào bộ lọc gốc
      const groupData = getGroupFilter(filters);
      return { ...filters, ...groupData };
  }
```

### Bước 4: Khóa quyền Data đối với API `getOne`, `update`, `delete`
Dù list đã chặn, ta vẫn phải chống việc lộ ID để can thiệp direct:

Trong `BaseService`, bổ sung 1 hook `checkOwnership`:
```typescript
  // src/common/core/services/base.service.ts
  import { verifyGroupOwnership } from '@/common/shared/utils/group-ownership.util';

  protected async checkOwnership(entity: T): Promise<void> {
    // Nếu entity là dạng tiêu chuẩn (có trường group_id thẳng ở database)
    if (entity && 'group_id' in (entity as any)) {
      verifyGroupOwnership(entity as any);
    }
  }
```

Sử dụng hook này trong mọi thao tác CRUD:
```typescript
  async getOne(id: any) {
      const entity = await this.repository.findById(id); ...
      await this.checkOwnership(entity); // TRỌNG TÂM: Khóa GET
      ...
  }

  async update(id: any, data: any) {
      const existing = await this.repository.findById(id);
      if (existing) await this.checkOwnership(existing); // TRỌNG TÂM: Khóa PUT/PATCH
      ...
  }
```

### Bước 5: Viết đè Context Check cho các Entity Ngoại Lệ (Cross-Context Data)
Với **User** (không có nhóm cứng mà nối qua `user_groups`), `verifyGroupOwnership` mặc định không hoạt động trên thuộc tính thẳng `group_id`. Bạn chỉ việc override hàm Hook ở riêng `UserService`:

**Tại `UserService` (`src/modules/core/user/admin/services/user.service.ts`):**
```typescript
  protected override async checkOwnership(entity: any): Promise<void> {
    const context = RequestContext.get<any>('context');
    const groupId = RequestContext.get<any>('groupId');

    // 1. Phân định ranh giới Context Cốt lõi
    if (context?.type === 'system') return; // Toàn cục -> Cho qua

    if (!context || !groupId) throw new ForbiddenException('No context!'); // Mất context -> Block

    // 2. Ép Context Cục bộ (Trừ hệ thống) kiểm tra truy xuất database join
    const isValid = await this.userRepo.exists({
       id: entity.id,
       user_groups: {
          some: { group_id: toPrimaryKey(groupId) }
       }
    });

    if (!isValid) throw new ForbiddenException('Lỗi Context: Bản ghi này thuộc ngữ cảnh Nhóm khác!');
  }
```

## Tổng kết Lợi ích cốt lõi
Hệ thống lúc này vận hành hoàn toàn bám chặt xoay quanh **Context**, bỏ tư duy Super Admin vs Group Admin. Bất kể là ai, nếu anh dùng System Context, anh quản lý tất cả. Nếu anh dùng Group Context, Data của anh bị giam đúng vào Group đó xuyên suốt API.
Và với `BaseService`, logic này được auto-apply 100% cho mọi module sau này!
