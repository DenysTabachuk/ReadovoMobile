import type { TimeValue } from '../../types';

/**
 * Format a picker Date as a padded local clock time.
 *
 * @param date - Date whose local hours and minutes should be read.
 * @returns An HH:mm string; seconds and the calendar date are omitted.
 * @example
 * formatTime(new Date(2026, 0, 1, 9, 5));
 * // => '09:05'
 */
export function formatTime(date: Date): TimeValue {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}` as TimeValue;
}
