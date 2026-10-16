import type { TimeValue } from '../../types';

export function createDateFromTime(time: TimeValue): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date;
}
