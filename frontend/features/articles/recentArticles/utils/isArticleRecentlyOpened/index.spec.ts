import { isArticleRecentlyOpened } from './index';

const article = {
  id: 42,
  title: 'Space',
  extract: '',
  url: 'https://example.test/42',
  openedAt: '2026-10-16T12:00:00.000Z',
};
describe('isArticleRecentlyOpened', () => {
  it('finds an exact ID and rejects other IDs', () => {
    expect(isArticleRecentlyOpened(42, [article])).toBe(true);
    expect(isArticleRecentlyOpened(7, [article])).toBe(false);
  });
  it('handles a missing ID, unloaded list, and empty list', () => {
    expect(isArticleRecentlyOpened(null, [article])).toBe(false);
    expect(isArticleRecentlyOpened(42, undefined)).toBe(false);
    expect(isArticleRecentlyOpened(42, [])).toBe(false);
  });
});
