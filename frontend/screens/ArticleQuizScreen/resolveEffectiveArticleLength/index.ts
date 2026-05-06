import { type SimplifyArticleTargetLength } from '@/api/wikipedia';
import { countSentences } from '@/utils/getNumSentences';

import { TARGET_LENGTH_MAX_SENTENCES } from '../constants';
import { type ArticleQuizLengthParam } from '../types';

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
