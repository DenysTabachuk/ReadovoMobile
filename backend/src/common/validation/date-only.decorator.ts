import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import { isDateOnly } from '../database/date-only';

export function IsDateOnly(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isDateOnly',
      options: validationOptions,
      propertyName: propertyName.toString(),
      target: target.constructor,
      validator: {
        defaultMessage(arguments_: ValidationArguments): string {
          return `${arguments_.property} must be a valid YYYY-MM-DD date`;
        },
        validate(value: unknown): boolean {
          return typeof value === 'string' && isDateOnly(value);
        },
      },
    });
  };
}
