import { ApiProperty } from '@nestjs/swagger';

/** Một phần tử trong body mảng gốc `PUT .../roles/batch` — `{ group_id, role_ids }`. */
export class UserRolesBatchItemDto {
  @ApiProperty({ example: 1 })
  group_id: number;

  @ApiProperty({ type: [Number], example: [11, 12] })
  role_ids: number[];
}
