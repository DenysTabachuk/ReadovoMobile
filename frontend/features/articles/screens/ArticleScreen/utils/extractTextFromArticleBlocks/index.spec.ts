import { extractTextFromArticleBlocks } from './index';

describe('extractTextFromArticleBlocks', () => {
  it('flattens every supported block shape in reading order', () => {
    expect(
      extractTextFromArticleBlocks([
        { type: 'heading', level: 1, text: 'Intro' },
        {
          type: 'paragraph',
          children: [
            { type: 'word', text: 'Hello' },
            { type: 'text', text: ' world.' },
          ],
        },
        {
          type: 'list',
          ordered: false,
          items: [
            [{ type: 'word', text: 'First' }],
            [{ type: 'word', text: 'Second' }],
          ],
        },
        {
          type: 'table',
          rows: [
            [{ text: 'A' }, { text: 'B' }],
            [{ text: 'C' }, { text: 'D' }],
          ],
        },
        { type: 'formula', altText: 'x squared', display: true },
        {
          type: 'image',
          src: 'https://example.test/image',
          alt: 'Moon',
          caption: 'At night',
        },
      ]),
    ).toBe(
      'Intro\n\nHello world.\n\nFirst\nSecond\n\nA B\nC D\n\nx squared\n\nMoon At night',
    );
  });
  it('omits empty descriptions and handles empty content', () => {
    expect(
      extractTextFromArticleBlocks([{ type: 'image', src: 'image' }]),
    ).toBe('');
    expect(extractTextFromArticleBlocks([])).toBe('');
  });
});
