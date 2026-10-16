import { isTokenKeyInsidePrefix } from './index';

describe('isTokenKeyInsidePrefix', () => {
  it.each([
    ['block-1-word-0-0', 'block-1', true],
    ['block-1-item-2-word-0-0', 'block-1', true],
    ['block-10-word-0-0', 'block-1', false],
    ['block-1', 'block-1', false],
    [undefined, 'block-1', false],
    ['table-row-0-cell-0-word-0-0', 'table', true],
  ])('checks key %j within %s', (key, prefix, expected) => {
    expect(isTokenKeyInsidePrefix(key, prefix)).toBe(expected);
  });
});
