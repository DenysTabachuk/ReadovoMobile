import { parsePlainTextToBlocks } from './index';

describe('parsePlainTextToBlocks', () => {
  it('joins paragraph lines and separates paragraphs on blank lines', () => {
    const result = parsePlainTextToBlocks(
      'First line\nsecond line\n\nLast paragraph',
    );
    expect(result).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'word', text: 'First' },
          { type: 'text', text: ' ' },
          { type: 'word', text: 'line' },
          { type: 'text', text: ' ' },
          { type: 'word', text: 'second' },
          { type: 'text', text: ' ' },
          { type: 'word', text: 'line' },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'word', text: 'Last' },
          { type: 'text', text: ' ' },
          { type: 'word', text: 'paragraph' },
        ],
      },
    ]);
  });
  it('reads wiki heading levels and caps deeply nested headings', () => {
    expect(
      parsePlainTextToBlocks('== Main ==\n=== Sub ===\n====== Deep ======'),
    ).toEqual([
      { type: 'heading', level: 1, text: 'Main' },
      { type: 'heading', level: 2, text: 'Sub' },
      { type: 'heading', level: 3, text: 'Deep' },
    ]);
  });
  it('recognizes unordered and numbered lists separated by blank lines', () => {
    expect(parsePlainTextToBlocks('* Alpha\n* Beta\n\n1. Gamma')).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [
          [{ type: 'word', text: 'Alpha' }],
          [{ type: 'word', text: 'Beta' }],
        ],
      },
      {
        type: 'list',
        ordered: true,
        items: [[{ type: 'word', text: 'Gamma' }]],
      },
    ]);
  });
  it('handles empty input and a single-word sentence', () => {
    expect(parsePlainTextToBlocks(' \n ')).toEqual([]);
    expect(parsePlainTextToBlocks('Hello.')).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'word', text: 'Hello' },
          { type: 'text', text: '.' },
        ],
      },
    ]);
  });
});
