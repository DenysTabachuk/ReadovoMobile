import { formatTime } from './index';

describe('formatTime', () => {
  it.each([
    [0, 0, '00:00'],
    [9, 5, '09:05'],
    [23, 59, '23:59'],
  ])('formats local %i:%i', (hours, minutes, expected) => {
    expect(formatTime(new Date(2026, 9, 16, hours, minutes, 42))).toBe(
      expected,
    );
  });
  it('ignores seconds without mutating the date', () => {
    const date = new Date(2026, 9, 16, 9, 5, 42, 100);
    const original = date.getTime();
    expect(formatTime(date)).toBe('09:05');
    expect(date.getTime()).toBe(original);
  });
});
