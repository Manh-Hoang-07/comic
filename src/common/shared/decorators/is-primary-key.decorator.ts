import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isPrimaryKey', async: false })
export class IsPrimaryKeyConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        if (value === null || value === undefined) return true; // Let @IsNotEmpty handle this

        // If it's a number or bigint
        if (typeof value === 'number' || typeof value === 'bigint') return true;

        if (typeof value === 'string') {
            // 1. UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
            if (isUuid) return true;

            // 2. MongoDB ObjectId
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(value);
            if (isObjectId) return true;

            // 3. Numeric string (for BigInt)
            const isNumeric = /^\d+$/.test(value);
            if (isNumeric) return true;
        }

        // If it's an array, we might want to validate elements (but usually @IsPrimaryKey is for single values)
        return false;
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a valid Primary Key (Number, BigInt, UUID, or ObjectId)`;
    }
}

/**
 * Decorator to validate that a value is a valid Primary Key.
 * Supports: Number, BigInt string, UUID, and MongoDB ObjectId.
 */
export function IsPrimaryKey(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPrimaryKeyConstraint,
        });
    };
}
