import { Transform } from 'class-transformer';

export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export function TrimToLowerCase(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}

export function TrimToUpperCase(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  );
}

export function ToNumber(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value !== 'string' || value.trim() === '') {
      return value;
    }

    return Number(value);
  });
}

export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    return value;
  });
}

export function ToUniquePositiveIntegerArray(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (Array.isArray(value)) {
      return Array.from(value as unknown[]);
    }

    if (typeof value !== 'string') {
      return value;
    }

    return Array.from(
      new Set(value.split(',').map((item) => Number(item.trim()))),
    );
  });
}
