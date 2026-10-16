import { isArticleSaved } from './index';

const article = {
  id: 42,
  title: 'Space',
  extract: '',
  url: 'https://example.test/42',
  savedAt: '2026-10-16T12:00:00.000Z',
};
describe('isArticleSaved', () => {
  it('finds an exact ID and rejects other IDs', () => {
    expect(isArticleSaved(42, [article])).toBe(true);
    expect(isArticleSaved(7, [article])).toBe(false);
  });
  it('handles a missing ID, unloaded list, and empty list', () => {
    expect(isArticleSaved(null, [article])).toBe(false);
    expect(isArticleSaved(42, undefined)).toBe(false);
    expect(isArticleSaved(42, [])).toBe(false);
  });
});
