import type {
  QuizVocabularyWord,
  ArticleVocabularyQuizQuestion,
} from '@/api/generated/transport';
import type { ArticleQuizMode } from '../../articleQuizSession';
import type {
  ArticleQuizLengthParam,
  SimplifyArticleLevel,
  SimplifyArticleTargetLength,
} from '@/features/articles/api';

export type ArticleQuizRouteParams = {
  id?: string | string[];
  level?: string | string[];
  mode?: string | string[];
  targetLength?: string | string[];
};

export type VocabularyWordQuestion = QuizVocabularyWord &
  Pick<ArticleVocabularyQuizQuestion, 'id'>;

export type ResolvedArticleQuizParams = {
  articleId: number | null;
  quizLevel: SimplifyArticleLevel;
  quizMode: ArticleQuizMode;
  quizTargetLength: ArticleQuizLengthParam;
  quizSessionTargetLength: SimplifyArticleTargetLength;
};
