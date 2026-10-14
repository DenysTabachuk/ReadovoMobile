const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateOnly(value: string): boolean {
  const match = DATE_ONLY_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function dateOnlyToDate(value: string): Date {
  if (!isDateOnly(value)) {
    throw new RangeError(`Invalid date-only value: ${value}`);
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function dateToDateOnly(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new RangeError('Cannot format an invalid Date as a date-only value.');
  }

  return value.toISOString().slice(0, 10);
}
