import { parseArticleId } from './index';

describe('parseArticleId', () => {
  it('accepts positive integer IDs and uses the first array value', () => {
    expect(parseArticleId('42')).toBe(42);
    expect(parseArticleId(['17', '99'])).toBe(17);
  });

  it.each([
    undefined,
    '',
    ' ',
    [],
    [''],
    'abc',
    '0',
    '-1',
    '1.5',
    'Infinity',
    '9007199254740992',
  ])('rejects invalid ID %p', (value) => {
    expect(parseArticleId(value)).toBeNull();
  });
});
