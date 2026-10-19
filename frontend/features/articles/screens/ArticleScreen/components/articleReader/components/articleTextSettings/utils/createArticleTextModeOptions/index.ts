import type { TFunction } from 'i18next';
import type { ArticleTextViewMode } from '../../../../../../types';

type AvailableTextModes = { adaptation: boolean; summary: boolean };
type TextModeOption = { label: string; value: ArticleTextViewMode };

/**
 * Build the text-mode switch with only available transformations.
 *
 * @param available - Availability of adaptation and summary at the selected level.
 * @param t - Translator for the switch labels.
 * @returns Original first, followed by available adaptation and summary modes.
 * @example
 * createArticleTextModeOptions({ adaptation: false, summary: true }, t).map((option) => option.value);
 * // => ['original', 'summary']
 */
export function createArticleTextModeOptions(
  available: AvailableTextModes,
  t: TFunction,
): TextModeOption[] {
  const options: TextModeOption[] = [
    { label: t('article.textModeShort.original'), value: 'original' },
  ];
  if (available.adaptation) {
    options.push({
      label: t('article.textModeShort.adapted'),
      value: 'adaptation',
    });
  }
  if (available.summary) {
    options.push({
      label: t('article.textModeShort.summary'),
      value: 'summary',
    });
  }
  return options;
}
