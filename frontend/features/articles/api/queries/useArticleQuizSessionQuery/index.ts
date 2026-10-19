import { skipToken, useQuery } from '@tanstack/react-query';
import {
  getArticleQuizSessionKey,
  type ArticleQuizMode,
} from '../../../articleQuizSession';
import type {
  ArticleQuizSessionResponse,
  SimplifyArticleLevel,
  SimplifyArticleTargetLength,
} from '../../types';

type ArticleQuizSessionQueryParams = {
  articleId: number;
  mode: ArticleQuizMode;
  level: SimplifyArticleLevel;
  targetLength: SimplifyArticleTargetLength;
};

export function useArticleQuizSessionQuery({
  articleId,
  mode,
  level,
  targetLength,
}: ArticleQuizSessionQueryParams) {
  // Observe the generated session without starting a second generation request.
  return useQuery<ArticleQuizSessionResponse>({
    queryKey: getArticleQuizSessionKey(articleId, mode, level, targetLength),
    queryFn: skipToken,
  });
}
