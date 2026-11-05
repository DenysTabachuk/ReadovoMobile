/**
 * Apply alpha to a six-digit hexadecimal color without changing its RGB channels.
 * @param color - Opaque color in #RRGGBB format; other formats throw TypeError.
 * @param opacity - Finite alpha from 0 to 1 inclusive; invalid values throw RangeError.
 * @returns An rgba() color string. Does not mutate input or clamp invalid alpha.
 * @example
 * withOpacity('#f2c94c', 0.22);
 * // => 'rgba(242, 201, 76, 0.22)'
 */
export function withOpacity(color: string, opacity: number): string {
  if (!/^#[\da-f]{6}$/i.test(color)) {
    throw new TypeError('Expected an opaque six-digit hexadecimal color.');
  }
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    throw new RangeError('Opacity must be a finite number between 0 and 1.');
  }
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
