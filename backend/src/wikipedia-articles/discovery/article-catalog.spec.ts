import {
  getCategorySearchQuery,
  selectRecommendedArticleTitles,
} from './article-catalog';

describe('article catalog', () => {
  it('builds a category-scoped Wikipedia search query', () => {
    expect(getCategorySearchQuery('gravity', 'science')).toBe(
      'gravity incategory:"Science"',
    );
    expect(getCategorySearchQuery('gravity', 'all')).toBe('gravity');
  });

  it('selects unique recommendations without mutating editorial data', () => {
    const first = selectRecommendedArticleTitles('science', 3, () => 0.5);
    const second = selectRecommendedArticleTitles('science', 3, () => 0.5);

    expect(first).toEqual(second);
    expect(first).toHaveLength(9);
    expect(new Set(first).size).toBe(first.length);
  });

  it('uses an unbiased shuffle that can be controlled in tests', () => {
    const recommendations = selectRecommendedArticleTitles('space', 2, () => 0);

    expect(recommendations).toEqual([
      'Mars',
      'Jupiter',
      'Milky Way',
      'International Space Station',
      'Hubble Space Telescope',
      'Space exploration',
    ]);
  });
});
