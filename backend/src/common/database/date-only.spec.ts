import { dateOnlyToDate, dateToDateOnly, isDateOnly } from './date-only';

describe('date-only database boundary', () => {
  it('round-trips a PostgreSQL date without timezone drift', () => {
    const date = dateOnlyToDate('2026-10-13');

    expect(date).toEqual(new Date('2026-10-13T00:00:00.000Z'));
    expect(dateToDateOnly(date)).toBe('2026-10-13');
  });

  it.each(['2026-02-29', '2026-13-01', 'not-a-date', '2026-1-01'])(
    'rejects invalid date-only value %s',
    (value) => {
      expect(isDateOnly(value)).toBe(false);
      expect(() => dateOnlyToDate(value)).toThrow(RangeError);
    },
  );

  it('accepts leap-day dates when the year is valid', () => {
    expect(isDateOnly('2028-02-29')).toBe(true);
  });
});
