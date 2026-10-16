import type { TimeValue } from '../../types';

export function formatTime(date: Date): TimeValue {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}` as TimeValue;
}
