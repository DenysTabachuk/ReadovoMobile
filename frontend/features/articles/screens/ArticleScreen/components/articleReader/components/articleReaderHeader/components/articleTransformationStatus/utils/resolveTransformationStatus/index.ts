import type { ArticleTransformationDetails } from '../../../../../../../../types';

type TransformationStatus = {
  key:
    | 'article.adaptedState'
    | 'article.summarizedState'
    | 'article.originalStateWithAdaptation'
    | 'article.originalStateWithSummary';
  values: {
    level: ArticleTransformationDetails['selectedLevel'];
    adaptedLength?: number;
    originalLength?: number;
  };
};

/**
 * Describe the displayed transformation or the latest generated version at this level.
 *
 * @param details - Displayed version, latest generation, and current language level.
 * @returns A translation key and values, or null without a matching generated version.
 * @example
 * resolveTransformationStatus({ displayedArticle: null, latestGeneratedArticle: null, selectedLevel: 'A2' });
 * // => null
 */
export function resolveTransformationStatus({
  displayedArticle,
  latestGeneratedArticle,
  selectedLevel,
}: ArticleTransformationDetails): TransformationStatus | null {
  if (displayedArticle) {
    return {
      key:
        displayedArticle.transformationType === 'adaptation'
          ? 'article.adaptedState'
          : 'article.summarizedState',
      values: {
        adaptedLength: displayedArticle.adaptedLength,
        originalLength: displayedArticle.originalLength,
        level: displayedArticle.level,
      },
    };
  }
  if (latestGeneratedArticle?.level !== selectedLevel) return null;
  return {
    key:
      latestGeneratedArticle.transformationType === 'adaptation'
        ? 'article.originalStateWithAdaptation'
        : 'article.originalStateWithSummary',
    values: { level: latestGeneratedArticle.level },
  };
}
