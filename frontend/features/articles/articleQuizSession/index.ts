import {
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
} from '@/api/wikipedia';

export type ArticleQuizMode = 'article' | 'vocabulary';

export function getArticleQuizSessionKey(
  articleId: number | null,
  mode: ArticleQuizMode,
  level: SimplifyArticleLevel,
  targetLength: SimplifyArticleTargetLength,
) {
  return ['articleQuizSession', articleId, mode, level, targetLength] as const;
}
