import { getHeadingTypographyType } from './index';

describe('getHeadingTypographyType', () => {
  it.each([
    [1, 'screenTitle'],
    [2, 'sectionTitle'],
    [3, 'bodyStrong'],
  ] as const)('maps heading level %i', (level, expected) => {
    expect(getHeadingTypographyType(level)).toBe(expected);
  });
});
