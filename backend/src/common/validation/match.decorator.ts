import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function MatchesProperty<T extends object>(
  property: keyof T,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      constraints: [property],
      name: 'matchesProperty',
      options: validationOptions,
      propertyName: propertyName.toString(),
      target: target.constructor,
      validator: {
        defaultMessage(arguments_: ValidationArguments): string {
          return `${arguments_.property} must match ${String(property)}`;
        },
        validate(value: unknown, arguments_: ValidationArguments): boolean {
          const [relatedProperty] = arguments_.constraints as [keyof T];
          const object = arguments_.object as T;

          return value === object[relatedProperty];
        },
      },
    });
  };
}
