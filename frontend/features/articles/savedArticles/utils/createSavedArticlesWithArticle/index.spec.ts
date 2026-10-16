import { createSavedArticlesWithArticle } from './index';

const article = {
  id: 42,
  title: 'Updated',
  extract: 'New text',
  url: 'https://example.test/42',
};
describe('createSavedArticlesWithArticle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-16T12:00:00.000Z'));
  });
  afterEach(() => jest.useRealTimers());
  it('creates the unloaded list with a deterministic timestamp', () => {
    expect(createSavedArticlesWithArticle(undefined, article)).toEqual([
      { ...article, savedAt: '2026-10-16T12:00:00.000Z' },
    ]);
  });
  it('replaces duplicates, keeps other entries in order, and leaves inputs unchanged', () => {
    const existing = { ...article, title: 'Old', savedAt: '2025-01-01' };
    const other = { ...existing, id: 7 };
    const list = [other, existing, existing];
    const result = createSavedArticlesWithArticle(list, article);
    expect(result).toEqual([
      { ...article, savedAt: '2026-10-16T12:00:00.000Z' },
      other,
    ]);
    expect(result[1]).toBe(other);
    expect(list).toEqual([other, existing, existing]);
    expect(article).not.toHaveProperty('savedAt');
  });
});
