import { splitTextToTouchableParts } from './index';

describe('splitTextToTouchableParts', () => {
  it('preserves emphasis and namespaces keys with original node indexes and offsets', () => {
    const result = splitTextToTouchableParts(
      [
        { type: 'text', text: ' ' },
        { type: 'word', text: 'Hello', bold: true },
        { type: 'text', text: '. ' },
        { type: 'word', text: 'Bye', italic: true },
      ],
      'block-2',
    );
    expect(result.map((part) => part.key)).toEqual([
      'block-2-text-0-0',
      'block-2-word-1-1',
      'block-2-text-2-6',
      'block-2-word-3-8',
    ]);
    expect(result[1]).toMatchObject({
      bold: true,
      sentenceKey: 'block-2-sentence-0',
      sentenceWordIndex: 0,
      word: 'hello',
    });
    expect(result[3]).toMatchObject({
      italic: true,
      sentenceKey: 'block-2-sentence-1',
      sentenceWordIndex: 0,
    });
  });
  it('normalizes curly apostrophes for dictionary words but preserves rendered text', () => {
    const node = { type: 'word' as const, text: 'It’s' };
    expect(splitTextToTouchableParts([node], 'b')[0]).toMatchObject({
      text: 'It’s',
      word: "it's",
    });
    expect(node.text).toBe('It’s');
    expect(splitTextToTouchableParts([], 'b')).toEqual([]);
  });
});
