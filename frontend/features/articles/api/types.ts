import type {
  ArticleSimplificationLevel,
  ArticleSimplificationTargetLength,
  GenerateArticleQuizResponse,
  GenerateArticleVocabularyQuizResponse,
} from '@/api/generated/transport';

export type {
  WikipediaArticle,
  FetchWikipediaArticlesParams,
  WikipediaArticleDetail,
  ArticleBlock,
  InlineNode,
  TableCell,
  ArticleTextTransformationType,
  ArticleAdaptationSummary,
  ArticleAdaptationsByArticleId,
  GenerateArticleQuizRequest,
  GenerateArticleVocabularyQuizRequest,
  SimplifyArticleResponse,
} from '@/api/generated/transport';

// The current picker exposes A1-B2; C1 remains a valid backend/response level.
export type SimplifyArticleLevel = Exclude<ArticleSimplificationLevel, 'C1'>;
export type SimplifyArticleTargetLength = ArticleSimplificationTargetLength;
export type ArticleQuizLengthParam = SimplifyArticleTargetLength | 'original';
export type ArticleQuizSessionResponse =
  GenerateArticleQuizResponse | GenerateArticleVocabularyQuizResponse;
