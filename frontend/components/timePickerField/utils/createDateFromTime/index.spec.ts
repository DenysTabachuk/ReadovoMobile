import { createDateFromTime } from './index';
import type { TimeValue } from '../../types';

describe('createDateFromTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 16, 14, 30, 45, 123));
  });
  afterEach(() => jest.useRealTimers());

  it.each([
    ['00:00', 0, 0],
    ['09:05', 9, 5],
    ['23:59', 23, 59],
  ])('sets local clock time %s on today', (time, hours, minutes) => {
    const date = createDateFromTime(time as TimeValue);
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2026, 9, 16,
    ]);
    expect([
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ]).toEqual([hours, minutes, 0, 0]);
  });

  it('creates independent Date objects without changing the current time', () => {
    const first = createDateFromTime('09:00');
    const second = createDateFromTime('09:00');
    expect(first).not.toBe(second);
    expect(new Date().getHours()).toBe(14);
  });
});
