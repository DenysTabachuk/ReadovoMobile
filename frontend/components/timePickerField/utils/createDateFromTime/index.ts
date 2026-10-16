import type { TimeValue } from '../../types';

/**
 * Convert a clock time into a local Date for the native time picker.
 *
 * Uses the current date and local timezone. Components are not validated; Date normalizes out-of-range values.
 *
 * @param time - Local hours and minutes in HH:mm form.
 * @returns A new Date on today's local date with seconds and milliseconds cleared.
 * @example
 * const date = createDateFromTime('09:05');
 * [date.getHours(), date.getMinutes(), date.getSeconds()];
 * // => [9, 5, 0]
 */
export function createDateFromTime(time: TimeValue): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date;
}
