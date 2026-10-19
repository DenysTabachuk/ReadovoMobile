import { parseArticleId } from '@/features/articles/utils/parseArticleId';
import { DEFAULT_LENGTH, DEFAULT_LEVEL } from '../../constants';
import type {
  ArticleQuizRouteParams,
  ResolvedArticleQuizParams,
} from '../../types';

/**
 * Normalize article-quiz route parameters and apply supported level/mode/length defaults.
 *
 * @param params - Router values; array parameters use their first value.
 * @returns Validated article ID (null when invalid), choices, and a concrete cache-session length.
 * @example
 * resolveArticleQuizParams({ id: '42', targetLength: 'original' }).quizSessionTargetLength;
 * // => 'medium'
 */
export function resolveArticleQuizParams(
  params: ArticleQuizRouteParams,
): ResolvedArticleQuizParams {
  const level = firstValue(params.level);
  const length = firstValue(params.targetLength);
  const quizTargetLength =
    length === 'original' ||
    length === 'short' ||
    length === 'medium' ||
    length === 'long'
      ? length
      : DEFAULT_LENGTH;
  return {
    articleId: parseArticleId(params.id),
    quizLevel:
      level === 'A1' || level === 'A2' || level === 'B1' || level === 'B2'
        ? level
        : DEFAULT_LEVEL,
    quizMode:
      firstValue(params.mode) === 'vocabulary'
        ? ('vocabulary' as const)
        : ('article' as const),
    quizTargetLength,
    quizSessionTargetLength:
      quizTargetLength === 'original' ? DEFAULT_LENGTH : quizTargetLength,
  };
}

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
