import type { DictionaryWordProgress } from '../../../../api/types';
import type { useTranslation } from 'react-i18next';

export function getProgressLabel(
  progress: DictionaryWordProgress,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return t(`dictionary.progress.${progress}`);
}
