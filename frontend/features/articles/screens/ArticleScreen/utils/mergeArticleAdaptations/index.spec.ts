import { mergeArticleAdaptations } from './index';
import type { ArticleAdaptationSummary } from '@/features/articles/api';

describe('mergeArticleAdaptations', () => {
  it('accepts empty sources', () => {
    expect(mergeArticleAdaptations([], [])).toEqual([]);
  });

  it('deduplicates by level and type, preserving order and preferring session entries', () => {
    const persisted: ArticleAdaptationSummary[] = [
      { level: 'A2', transformationType: 'summary' },
      { level: 'A1', transformationType: 'adaptation' },
      { level: 'A2', transformationType: 'summary' },
    ];
    const current: ArticleAdaptationSummary[] = [
      { level: 'A2', transformationType: 'summary' },
      { level: 'A2', transformationType: 'adaptation' },
      { level: 'B1', transformationType: 'summary' },
    ];
    const before = JSON.parse(JSON.stringify({ persisted, current }));
    const result = mergeArticleAdaptations(persisted, current);
    expect(result).toEqual([
      { level: 'A2', transformationType: 'summary' },
      { level: 'A1', transformationType: 'adaptation' },
      { level: 'A2', transformationType: 'adaptation' },
      { level: 'B1', transformationType: 'summary' },
    ]);
    expect(result[0]).toBe(current[0]);
    expect({ persisted, current }).toEqual(before);
  });
});
