import { countActiveArticleFilters } from './index';

const defaults = {
  personalFilter: null,
  searchValue: '',
  preferImagesFirst: false,
  readyLevelFilter: 'all' as const,
  readyAdaptationEnabled: false,
  readySummaryEnabled: false,
  sortByFilter: 'default' as const,
  categoryFilter: 'all' as const,
  recommendedArticles: true,
};

describe('countActiveArticleFilters', () => {
  it('excludes defaults and whitespace-only searches', () => {
    expect(countActiveArticleFilters(defaults)).toBe(0);
    expect(countActiveArticleFilters({ ...defaults, searchValue: '  ' })).toBe(
      0,
    );
  });
  it('counts one transformation group even when both modes are selected', () => {
    expect(
      countActiveArticleFilters({ ...defaults, readyAdaptationEnabled: true }),
    ).toBe(1);
    expect(
      countActiveArticleFilters({ ...defaults, readySummaryEnabled: true }),
    ).toBe(1);
    expect(
      countActiveArticleFilters({
        ...defaults,
        readyAdaptationEnabled: true,
        readySummaryEnabled: true,
      }),
    ).toBe(1);
  });
  it('counts every independently selected group', () => {
    expect(
      countActiveArticleFilters({
        personalFilter: 'saved',
        searchValue: 'moon',
        preferImagesFirst: true,
        readyLevelFilter: 'A2',
        readyAdaptationEnabled: true,
        readySummaryEnabled: true,
        sortByFilter: 'length_desc',
        categoryFilter: 'space',
        recommendedArticles: false,
      }),
    ).toBe(8);
  });
});
