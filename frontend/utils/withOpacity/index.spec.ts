import { withOpacity } from '.';

describe('withOpacity', () => {
  it.each([
    ['#f2c94c', 0.22, 'rgba(242, 201, 76, 0.22)'],
    ['#ABCDEF', 0.5, 'rgba(171, 205, 239, 0.5)'],
    ['#000000', 0, 'rgba(0, 0, 0, 0)'],
    ['#ffffff', 1, 'rgba(255, 255, 255, 1)'],
  ] as const)('applies alpha to %s', (color, alpha, expected) => {
    expect(withOpacity(color, alpha)).toBe(expected);
  });

  it.each(['#fff', '#00000000', '#GGGGGG', 'red', 'rgb(0,0,0)', 'ffffff'])(
    'rejects unsupported color %s',
    (color) => expect(() => withOpacity(color, 0.5)).toThrow(TypeError),
  );

  it.each([-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid alpha %s',
    (alpha) => expect(() => withOpacity('#000000', alpha)).toThrow(RangeError),
  );
});
