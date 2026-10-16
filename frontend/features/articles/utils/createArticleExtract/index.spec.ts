import { createArticleExtract } from './index';

describe('createArticleExtract', () => {
  it('normalizes whitespace and handles empty text', () => {
    expect(createArticleExtract('  Hello\n world!  ')).toBe('Hello world!');
    expect(createArticleExtract(' \t ')).toBe('');
  });
  it('preserves exactly 180 characters and adds an ellipsis only beyond the boundary', () => {
    expect(createArticleExtract('x'.repeat(180))).toBe('x'.repeat(180));
    expect(createArticleExtract('x'.repeat(181))).toBe('x'.repeat(177) + '...');
  });
});
