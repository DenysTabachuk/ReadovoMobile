/**
 * Format a text-comparison metric with its optional unit.
 *
 * @param value - Numeric metric to display.
 * @param decimals - Positive decimal precision for toFixed, or a nonpositive value for
 *   integer rounding.
 * @param suffix - Unit appended after a space, or an empty string for no unit.
 * @returns The formatted value; invalid positive precision propagates the native toFixed
 *   RangeError.
 * @example
 * formatMetricValue(12.345, 1, 'words');
 * // => '12.3 words'
 */
export function formatMetricValue(
  value: number,
  decimals: number,
  suffix: string,
): string {
  const formatted =
    decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return suffix ? `${formatted} ${suffix}` : formatted;
}
