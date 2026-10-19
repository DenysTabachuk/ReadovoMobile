import type { ArticleAdaptationSummary } from '@/features/articles/api';
import type { TFunction } from 'i18next';
import { isSameAdaptation } from '../../../../utils';

const ARTICLE_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

/**
 * Build language-level picker options with available adaptation and summary badges.
 *
 * @param adaptations - Available versions; duplicate entries produce one badge.
 * @param t - Translator for level labels and accessible badge descriptions.
 * @returns Options ordered A1 through B2; unavailable versions have no status icons.
 * @example
 * createArticleLevelOptions([], t).map((option) => option.value);
 * // => ['A1', 'A2', 'B1', 'B2']
 */
export function createArticleLevelOptions(
  adaptations: readonly ArticleAdaptationSummary[],
  t: TFunction,
) {
  return ARTICLE_LEVELS.map((level) => {
    const statusIcons = [];
    if (
      adaptations.some((adaptation) =>
        isSameAdaptation(adaptation, level, 'adaptation'),
      )
    ) {
      statusIcons.push({
        accessibilityLabel: t('article.levelOptionReadyAdaptation'),
        name: 'sparkles-outline' as const,
      });
    }
    if (
      adaptations.some((adaptation) =>
        isSameAdaptation(adaptation, level, 'summary'),
      )
    ) {
      statusIcons.push({
        accessibilityLabel: t('article.levelOptionReadySummary'),
        name: 'document-text-outline' as const,
      });
    }
    return {
      label: t(`article.levels.${level}`),
      statusIcons: statusIcons.length ? statusIcons : undefined,
      value: level,
    };
  });
}
