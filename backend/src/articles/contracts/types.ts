import { type ArticleListQueryDto } from '../dto/article-list-query.dto';
import { type SimplifyArticleResponseDto } from '../dto/simplify-article-response.dto';
import { type ArticleAdaptationSummaryResponseDto } from '../dto/article-adaptation-summary-response.dto';
import { type WikipediaArticleDetailResponseDto } from '../dto/get-wikipedia-article-detail-response.dto';
import { type UserRecentArticleResponseDto } from '../dto/get-recent-articles-response.dto';
import { type UserSavedArticleResponseDto } from '../dto/get-saved-articles-response.dto';
import { type WikipediaArticleResponseDto } from '../dto/wikipedia-article-response.dto';
import {
  ARTICLE_CATEGORIES,
  SIMPLIFICATION_LEVELS,
  TRANSFORMATION_TYPES,
  ARTICLE_PREVIEW_LENGTHS,
  ARTICLE_SORT_OPTIONS,
  ARTICLE_READY_LEVELS,
  ARTICLE_READY_TRANSFORMATIONS,
  ARTICLE_TARGET_LENGTHS,
  ARTICLE_QUESTION_TYPES,
  VOCABULARY_QUESTION_FORMATS,
  VOCABULARY_TERM_KINDS,
} from './constants';
export type WikipediaArticle = WikipediaArticleResponseDto;

export type UserSavedArticle = UserSavedArticleResponseDto;

export type UserRecentArticle = UserRecentArticleResponseDto;

export type GetWikipediaArticlesParams = ArticleListQueryDto;

export type WikipediaArticlePreviewLength =
  (typeof ARTICLE_PREVIEW_LENGTHS)[number];
export type WikipediaArticleSortOption = (typeof ARTICLE_SORT_OPTIONS)[number];
export type ArticleReadyLevelFilter = (typeof ARTICLE_READY_LEVELS)[number];
export type ArticleReadyTransformationFilter =
  (typeof ARTICLE_READY_TRANSFORMATIONS)[number];

export type WikipediaArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export type WikipediaArticleDetail = WikipediaArticleDetailResponseDto;

export type ArticleBlock =
  | {
      level: 1 | 2 | 3;
      text: string;
      type: 'heading';
    }
  | {
      children: InlineNode[];
      type: 'paragraph';
    }
  | {
      items: InlineNode[][];
      ordered: boolean;
      type: 'list';
    }
  | {
      rows: TableCell[][];
      type: 'table';
    }
  | FormulaBlock
  | {
      alt?: string;
      caption?: string;
      src: string;
      type: 'image';
    };

export type FormulaBlock = {
  altText: string;
  display: boolean;
  heightEx?: number;
  latex?: string;
  mathml?: string;
  svg?: string;
  type: 'formula';
  widthEx?: number;
};

export type InlineNode =
  | {
      bold?: boolean;
      italic?: boolean;
      text: string;
      type: 'text';
    }
  | {
      bold?: boolean;
      italic?: boolean;
      text: string;
      type: 'word';
    };

export type TableCell = {
  header?: boolean;
  text: string;
};

export type ArticleSimplificationLevel = (typeof SIMPLIFICATION_LEVELS)[number];

export type ArticleSimplificationTargetLength =
  (typeof ARTICLE_TARGET_LENGTHS)[number];
export type ArticleTextTransformationType =
  (typeof TRANSFORMATION_TYPES)[number];
export type ArticleQuizSourceCoverage = 'complete' | 'representative_excerpts';

export type ArticleAdaptationSummary = ArticleAdaptationSummaryResponseDto;

export type ArticleAdaptationsByArticleId = Record<
  string,
  ArticleAdaptationSummary[]
>;

export type ArticleQuizQuestionType = (typeof ARTICLE_QUESTION_TYPES)[number];

export type ArticleQuizQuestionOption = {
  id: string;
  text: string;
};

export type ArticleQuizQuestion = {
  correctOptionIds: string[];
  explanation?: string;
  id: string;
  options: ArticleQuizQuestionOption[];
  prompt: string;
  type: ArticleQuizQuestionType;
};

export type ArticleVocabularyQuizQuestionFormat =
  (typeof VOCABULARY_QUESTION_FORMATS)[number];

export type ArticleVocabularyQuizTermKind =
  (typeof VOCABULARY_TERM_KINDS)[number];

export type ArticleVocabularyQuizQuestion = ArticleQuizQuestion & {
  format: ArticleVocabularyQuizQuestionFormat;
  sourceExcerpt?: string;
  term: string;
  termKind: ArticleVocabularyQuizTermKind;
  translation: string;
  type: 'single_choice';
};

export type GenerateArticleVocabularyQuizResponse = {
  questions: ArticleVocabularyQuizQuestion[];
  resolvedLevel: ArticleSimplificationLevel;
};

export type SimplifyArticleResponse = SimplifyArticleResponseDto;

export type SimplifiedArticleCacheRow = {
  adapted_blocks?: ArticleBlock[];
  adapted_length: number;
  adapted_text?: string;
  article_id?: number;
  questions?: ArticleQuizQuestion[];
  level: string;
  original_length: number;
  source_hash?: string;
  target_length: string;
  title: string;
};
