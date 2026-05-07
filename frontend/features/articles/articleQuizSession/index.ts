import {
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
} from '@/api/wikipedia';

export function getArticleQuizSessionKey(
  articleId: number | null,
  level: SimplifyArticleLevel,
  targetLength: SimplifyArticleTargetLength,
) {
  return ['articleQuizSession', articleId, level, targetLength] as const;
}
