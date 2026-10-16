import { formatMetricValue } from './index';

describe('formatMetricValue', () => {
  it.each([
    [12.345, 1, 'words', '12.3 words'],
    [12.6, 0, '', '13'],
    [12.345, 2, '', '12.35'],
    [0, 0, 'chars', '0 chars'],
  ])('formats %f with %i decimals', (value, decimals, suffix, expected) => {
    expect(formatMetricValue(value, decimals, suffix)).toBe(expected);
  });
  it('propagates invalid positive precision', () => {
    expect(() => formatMetricValue(1, 101, '')).toThrow(RangeError);
  });
});
