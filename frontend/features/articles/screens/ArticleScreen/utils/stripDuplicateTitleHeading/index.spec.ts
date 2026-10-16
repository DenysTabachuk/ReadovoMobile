import { stripDuplicateTitleHeading } from './index';

describe('stripDuplicateTitleHeading', () => {
  it('removes only the matching leading level-one title and preserves the input', () => {
    const paragraph = { type: 'paragraph' as const, children: [] };
    const blocks = [
      { type: 'heading' as const, level: 1 as const, text: ' INTRO ' },
      paragraph,
    ];
    const result = stripDuplicateTitleHeading(blocks, 'intro');
    expect(result).toEqual([paragraph]);
    expect(result[0]).toBe(paragraph);
    expect(blocks).toHaveLength(2);
  });
  it('retains the original array for a different title or a deeper heading', () => {
    const blocks = [
      { type: 'heading' as const, level: 2 as const, text: 'Intro' },
    ];
    expect(stripDuplicateTitleHeading(blocks, 'Intro')).toBe(blocks);
    expect(stripDuplicateTitleHeading(blocks, 'Other')).toBe(blocks);
    expect(stripDuplicateTitleHeading([], 'Intro')).toEqual([]);
  });
});
