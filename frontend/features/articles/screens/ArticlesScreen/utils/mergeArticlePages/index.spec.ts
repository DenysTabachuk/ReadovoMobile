import { mergeArticlePages } from './index';

describe('mergeArticlePages', () => {
  it('handles unloaded and empty pages', () => {
    expect(mergeArticlePages()).toEqual([]);
    expect(mergeArticlePages([[]])).toEqual([]);
  });
  it('keeps first-seen ordering and the newest article reference', () => {
    const first = { id: 1, title: 'Old', extract: '', url: '' };
    const second = { id: 2, title: 'Second', extract: '', url: '' };
    const replacement = { ...first, title: 'New' };
    const pages = [[first, second], [replacement]];
    const result = mergeArticlePages(pages);
    expect(result.map((article) => article.title)).toEqual(['New', 'Second']);
    expect(result[0]).toBe(replacement);
    expect(pages[0][0]).toBe(first);
    expect(pages[0]).toHaveLength(2);
  });
});
