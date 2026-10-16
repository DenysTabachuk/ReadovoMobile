import { getBlockIndexFromTokenKey } from './index';

describe('getBlockIndexFromTokenKey', () => {
  it.each([
    ['block-0-word-0-0', 0],
    ['block-12-item-0-word-1-5', 12],
    ['block-42', 42],
  ])('reads %s', (key, index) => {
    expect(getBlockIndexFromTokenKey(key)).toBe(index);
  });
  it.each([
    undefined,
    '',
    'table-row-0',
    'heading-1-Title',
    'prefix-block-1',
    'block-1suffix',
    'block--1',
  ])('rejects %j', (key) => {
    expect(getBlockIndexFromTokenKey(key)).toBeNull();
  });
});
