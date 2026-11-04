import type {
  ArticleSimplificationLevel,
  ArticleSimplificationTargetLength,
  GenerateArticleQuizResponse,
  GenerateArticleVocabularyQuizResponse,
} from '@/api/generated/transport';

export type {
  WikipediaArticle,
  FetchWikipediaArticlesParams,
  WikipediaArticlePreviewLength,
  WikipediaArticleSortOption,
  ArticleReadyLevelFilter,
  ArticleReadyTransformationFilter,
  WikipediaArticleCategory,
  WikipediaArticleDetail,
  ArticleBlock,
  FormulaBlock,
  InlineNode,
  TableCell,
  ArticleTextTransformationType,
  ArticleAdaptationSummary,
  ArticleAdaptationsByArticleId,
  ArticleQuizQuestionType,
  ArticleQuizQuestionOption,
  ArticleQuizQuestion,
  ArticleVocabularyQuizQuestionFormat,
  ArticleVocabularyQuizQuestion,
  SimplifyArticleRequest,
  GenerateArticleQuizRequest,
  GenerateArticleQuizResponse,
  GenerateArticleVocabularyQuizRequest,
  GenerateArticleVocabularyQuizResponse,
  SimplifyArticleResponse,
} from '@/api/generated/transport';

// The current picker exposes A1-B2; C1 remains a valid backend/response level.
export type SimplifyArticleLevel = Exclude<ArticleSimplificationLevel, 'C1'>;
export type VocabularyQuizResolvedLevel = ArticleSimplificationLevel;
export type SimplifyArticleTargetLength = ArticleSimplificationTargetLength;
export type ArticleQuizLengthParam = SimplifyArticleTargetLength | 'original';
export type ArticleQuizSessionResponse =
  GenerateArticleQuizResponse | GenerateArticleVocabularyQuizResponse;
