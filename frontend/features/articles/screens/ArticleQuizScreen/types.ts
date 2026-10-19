import type { ArticleQuizMode } from '../../articleQuizSession';
import type {
  ArticleQuizLengthParam,
  SimplifyArticleLevel,
  SimplifyArticleTargetLength,
  ArticleVocabularyQuizQuestion,
} from '@/features/articles/api';

export type ArticleQuizRouteParams = {
  id?: string | string[];
  level?: string | string[];
  mode?: string | string[];
  targetLength?: string | string[];
};

export type VocabularyWordQuestion = Pick<
  ArticleVocabularyQuizQuestion,
  'id' | 'term' | 'translation' | 'sourceExcerpt'
>;

export type ResolvedArticleQuizParams = {
  articleId: number | null;
  quizLevel: SimplifyArticleLevel;
  quizMode: ArticleQuizMode;
  quizTargetLength: ArticleQuizLengthParam;
  quizSessionTargetLength: SimplifyArticleTargetLength;
};
