import type {
  SimplifyArticleTargetLength,
  ArticleQuizLengthParam,
} from '../../../../types';
import { countSentences } from '@/utils/countSentences';

import { TARGET_LENGTH_MAX_SENTENCES } from './constants';

/**
 * Resolve the original-text option to a concrete quiz length.
 *
 * @param targetLength - Explicit length or the original-text option.
 * @param text - Article text used only when original is selected.
 * @returns An explicit short, medium, or long length; original is classified using
 *   sentence-count thresholds.
 * @example
 * resolveEffectiveTargetLength('original', 'Hello.');
 * // => 'short'
 */
export function resolveEffectiveTargetLength(
  targetLength: ArticleQuizLengthParam,
  text: string,
): SimplifyArticleTargetLength {
  if (targetLength !== 'original') {
    return targetLength;
  }

  const sentenceCount = countSentences(text);

  if (sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.short) {
    return 'short';
  }

  if (sentenceCount <= TARGET_LENGTH_MAX_SENTENCES.medium) {
    return 'medium';
  }

  return 'long';
}
