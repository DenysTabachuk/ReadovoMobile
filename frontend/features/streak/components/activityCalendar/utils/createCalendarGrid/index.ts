import type { StreakCalendarDay } from '../../../../types';
import { CALENDAR_GRID_ROWS } from '../../constants';

const DAYS_PER_WEEK = 7;
const CALENDAR_GRID_CELL_COUNT = CALENDAR_GRID_ROWS * DAYS_PER_WEEK;

/**
 * Aligns a month's days to a Monday-first, six-row calendar using null placeholders.
 * Uses UTC weekday arithmetic so alignment does not depend on the device timezone.
 *
 * @param days - Chronologically ordered days of one month, starting on its first day,
 * with valid YYYY-MM-DD date keys. Missing or empty data produces 42 empty cells.
 * @returns A new padded array preserving day order, objects, and statuses. Does not
 * mutate the input or truncate it; valid month data always fits the six-row grid.
 * @example
 * createCalendarGrid([{ date: '2026-06-01', dayOfMonth: 1, status: 'completed' }]);
 * // => [the original Monday day object, ...41 null placeholders]
 */
export function createCalendarGrid(
  days: readonly StreakCalendarDay[] = [],
): (StreakCalendarDay | null)[] {
  if (days.length === 0) {
    return Array.from({ length: CALENDAR_GRID_CELL_COUNT }, () => null);
  }

  const offset = getMonthStartOffset(days[0].date);
  const cells = [...Array.from({ length: offset }, () => null), ...days];
  const trailingCellCount = Math.max(
    CALENDAR_GRID_CELL_COUNT - cells.length,
    0,
  );
  return [...cells, ...Array.from({ length: trailingCellCount }, () => null)];
}

function getMonthStartOffset(dateKey: string): number {
  const day = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? DAYS_PER_WEEK - 1 : day - 1;
}
