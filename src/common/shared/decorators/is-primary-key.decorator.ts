import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { getDbIdType } from '@/common/core/utils/primary-key.util';

@ValidatorConstraint({ name: 'isPrimaryKey', async: false })
export class IsPrimaryKeyConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (value === null || value === undefined) return true; // Let @IsNotEmpty handle this

    const idType = getDbIdType();

    // 1. UUID logic
    if (idType === 'uuid') {
      if (typeof value !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      );
    }

    // 2. ObjectId logic
    if (idType === 'objectid') {
      if (typeof value !== 'string') return false;
      return /^[0-9a-fA-F]{24}$/.test(value);
    }

    // 3. Default: BigInt logic
    // If it's a number or bigint
    if (typeof value === 'number' && !isNaN(value)) return true;
    if (typeof value === 'bigint') return true;

    if (typeof value === 'string') {
      const isNumeric = /^\d+$/.test(value);
      if (isNumeric) return true;
    }

    // If it's an array, we might want to validate elements (but usually @IsPrimaryKey is for single values)
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    const idType = getDbIdType();
    if (idType === 'uuid') return `${args.property} must be a valid UUID`;
    if (idType === 'objectid')
      return `${args.property} must be a valid ObjectId`;
    return `${args.property} must be a valid Primary Key (Number or BigInt string)`;
  }
}

/**
 * Decorator to validate that a value is a valid Primary Key.
 * Supports: Number, BigInt string, UUID, and MongoDB ObjectId.
 */
export function IsPrimaryKey(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPrimaryKeyConstraint,
    });
  };
}
