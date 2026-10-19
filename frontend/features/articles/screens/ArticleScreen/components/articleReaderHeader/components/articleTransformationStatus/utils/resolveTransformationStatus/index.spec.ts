import type { SimplifyArticleResponse } from '@/features/articles/api';
import { resolveTransformationStatus } from './index';

const article: SimplifyArticleResponse = {
  adaptedBlocks: [],
  adaptedLength: 10,
  originalLength: 30,
  level: 'A2',
  title: 'Space',
  transformationType: 'adaptation',
};

describe('resolveTransformationStatus', () => {
  it.each(['adaptation', 'summary'] as const)(
    'describes the displayed %s',
    (transformationType) => {
      expect(
        resolveTransformationStatus({
          displayedArticle: { ...article, transformationType },
          latestGeneratedArticle: null,
          selectedLevel: 'A2',
        }),
      ).toEqual({
        key:
          transformationType === 'adaptation'
            ? 'article.adaptedState'
            : 'article.summarizedState',
        values: { level: 'A2', adaptedLength: 10, originalLength: 30 },
      });
    },
  );
  it.each(['adaptation', 'summary'] as const)(
    'describes a generated %s while viewing original',
    (transformationType) => {
      expect(
        resolveTransformationStatus({
          displayedArticle: null,
          latestGeneratedArticle: { ...article, transformationType },
          selectedLevel: 'A2',
        }),
      ).toEqual({
        key:
          transformationType === 'adaptation'
            ? 'article.originalStateWithAdaptation'
            : 'article.originalStateWithSummary',
        values: { level: 'A2' },
      });
    },
  );
  it('omits status without a version at the selected level', () => {
    expect(
      resolveTransformationStatus({
        displayedArticle: null,
        latestGeneratedArticle: null,
        selectedLevel: 'A2',
      }),
    ).toBeNull();
    expect(
      resolveTransformationStatus({
        displayedArticle: null,
        latestGeneratedArticle: article,
        selectedLevel: 'B1',
      }),
    ).toBeNull();
  });
});
