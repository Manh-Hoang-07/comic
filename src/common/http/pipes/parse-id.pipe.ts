import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { getDbIdType, DbIdType } from '@/common/core/utils/primary-key.util';

@Injectable()
export class ParseIdPipe implements PipeTransform<
  string | number,
  string | bigint | number
> {
  transform(value: string | number): string | bigint | number {
    if (value === undefined || value === null) {
      throw new BadRequestException('Validation failed (ID expected)');
    }

    const idType: DbIdType = getDbIdType();

    if (idType === 'uuid' || idType === 'objectid') {
      return String(value);
    }

    try {
      return BigInt(value);
    } catch (_error) {
      throw new BadRequestException(
        'Validation failed (BigInt string is expected for ID)',
      );
    }
  }
}
