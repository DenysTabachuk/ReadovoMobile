import { resolveDisplayedArticles } from './index';

const first = { id: 1, title: 'One', url: '', extract: '' };
const second = { id: 2, title: 'Two', url: '', extract: '' };
const summary = [
  { level: 'A2' as const, transformationType: 'summary' as const },
];
const adaptation = [
  { level: 'B1' as const, transformationType: 'adaptation' as const },
];
const defaults = {
  articles: [first, second],
  savedArticles: [second],
  recentArticles: [first],
  personalFilter: null,
  personalArticleAdaptations: {},
};

describe('resolveDisplayedArticles', () => {
  it('selects the requested feed in source order', () => {
    expect(resolveDisplayedArticles(defaults)).toEqual([first, second]);
    expect(
      resolveDisplayedArticles({ ...defaults, personalFilter: 'saved' }),
    ).toEqual([second]);
    expect(
      resolveDisplayedArticles({ ...defaults, personalFilter: 'recent' }),
    ).toEqual([first]);
    expect(resolveDisplayedArticles({ ...defaults, articles: [] })).toEqual([]);
  });
  it('fills personal metadata without changing stored articles', () => {
    const result = resolveDisplayedArticles({
      ...defaults,
      personalFilter: 'saved',
      personalArticleAdaptations: { '2': summary },
    });
    expect(result).toEqual([{ ...second, availableAdaptations: summary }]);
    expect(second).not.toHaveProperty('availableAdaptations');
    expect(result[0]).not.toBe(second);
  });
  it('uses discovery metadata as fallback and preserves entries without data', () => {
    expect(
      resolveDisplayedArticles({
        ...defaults,
        articles: [{ ...first, availableAdaptations: summary }],
        personalFilter: 'recent',
      }),
    ).toEqual([{ ...first, availableAdaptations: summary }]);
    expect(resolveDisplayedArticles(defaults)[0]).toBe(first);
  });
  it('prefers metadata carried by the entry over fallback sources', () => {
    expect(
      resolveDisplayedArticles({
        ...defaults,
        articles: [{ ...first, availableAdaptations: adaptation }],
        personalArticleAdaptations: { '1': summary },
      })[0].availableAdaptations,
    ).toBe(adaptation);
  });
});
