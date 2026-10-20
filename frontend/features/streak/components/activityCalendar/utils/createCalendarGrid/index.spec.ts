import type { StreakCalendarDay } from '../../../../types';
import { createCalendarGrid } from '.';

function createMonthDays(monthKey: string, count: number): StreakCalendarDay[] {
  return Array.from({ length: count }, (_, index) => ({
    date: `${monthKey}-${String(index + 1).padStart(2, '0')}`,
    dayOfMonth: index + 1,
    status: 'neutral',
  }));
}

describe('createCalendarGrid', () => {
  it('provides 42 empty cells for missing or empty month data', () => {
    const missing = createCalendarGrid();
    const empty = createCalendarGrid([]);
    expect(missing).toEqual(Array(42).fill(null));
    expect(empty).toEqual(Array(42).fill(null));
    expect(missing).not.toBe(empty);
  });

  it.each([
    ['2025-09', 30, 0, 12], // Monday
    ['2025-07', 31, 1, 10], // Tuesday
    ['2025-10', 31, 2, 9], // Wednesday
    ['2024-02', 29, 3, 10], // Thursday; leap year
    ['2026-05', 31, 4, 7], // Friday
    ['2026-08', 31, 5, 6], // Saturday
    ['2026-03', 31, 6, 5], // Sunday; occupies all six rows
  ] as const)(
    'aligns %s with %s days, %s leading cells, and %s trailing cells',
    (month, count, leading, trailing) => {
      const days = createMonthDays(month, count);
      const grid = createCalendarGrid(days);
      expect(grid).toHaveLength(42);
      expect(grid.slice(0, leading)).toEqual(Array(leading).fill(null));
      expect(grid.slice(leading, leading + count)).toEqual(days);
      expect(grid.slice(leading + count)).toEqual(Array(trailing).fill(null));
      expect(grid[leading]).toBe(days[0]);
      expect(grid[leading + count - 1]).toBe(days[count - 1]);
    },
  );

  it('keeps a 28-day February aligned without inventing extra days', () => {
    const days = createMonthDays('2027-02', 28);
    const grid = createCalendarGrid(days);
    expect(grid.slice(0, 28)).toEqual(days);
    expect(grid.slice(28)).toEqual(Array(14).fill(null));
  });

  it('preserves frozen input, day references, ordering, and statuses', () => {
    const days = createMonthDays('2026-06', 30);
    days[0].status = 'completed';
    days[1].status = 'frozen';
    days[2].status = 'missed';
    days.forEach(Object.freeze);
    Object.freeze(days);
    const grid = createCalendarGrid(days);
    expect(grid).not.toBe(days);
    expect(grid.slice(0, 3)).toEqual([
      { date: '2026-06-01', dayOfMonth: 1, status: 'completed' },
      { date: '2026-06-02', dayOfMonth: 2, status: 'frozen' },
      { date: '2026-06-03', dayOfMonth: 3, status: 'missed' },
    ]);
    days.forEach((day, index) => expect(grid[index]).toBe(day));
    expect(days).toHaveLength(30);
  });

  it.each(['Pacific/Honolulu', 'Pacific/Kiritimati'])(
    'uses the same Sunday offset in timezone %s',
    (timezone) => {
      const previous = process.env.TZ;
      try {
        process.env.TZ = timezone;
        const days = createMonthDays('2026-03', 31);
        const grid = createCalendarGrid(days);
        expect(grid.slice(0, 6)).toEqual([null, null, null, null, null, null]);
        expect(grid[6]).toBe(days[0]);
      } finally {
        if (previous === undefined) {
          delete process.env.TZ;
        } else {
          process.env.TZ = previous;
        }
      }
    },
  );
});
