import type { DictionaryWordProgress } from '@/features/dictionary/api/types';
import type { useTranslation } from 'react-i18next';

/**
 * Translate the label for a dictionary learning state.
 *
 * @param progress - Dictionary learning state to describe.
 * @param t - Translation function from the current localization context.
 * @returns The translated dictionary.progress.<state> label.
 * @example
 * getProgressLabel('learned', i18n.getFixedT('en'));
 * // => 'Learned'
 */
export function getProgressLabel(
  progress: DictionaryWordProgress,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return t(`dictionary.progress.${progress}`);
}
