export type WikipediaArticle = {
  availableAdaptations?: ArticleAdaptationSummary[];
  id: number;
  title: string;
  extract: string;
  pageLength?: number;
  url: string;
  thumbnailUrl?: string;
};

export type FetchWikipediaArticlesParams = {
  category?: WikipediaArticleCategory;
  excludeIds?: number[];
  limit?: number;
  previewLength?: WikipediaArticlePreviewLength;
  recommended?: boolean;
  search?: string;
};

export type WikipediaArticlePreviewLength =
  | 'all'
  | 'short'
  | 'medium'
  | 'long';

export type WikipediaArticleCategory =
  | 'all'
  | 'biography'
  | 'food'
  | 'geography'
  | 'history'
  | 'space'
  | 'sports'
  | 'science'
  | 'technology'
  | 'nature'
  | 'culture';

export type WikipediaArticleDetail = {
  blocks: ArticleBlock[];
  content: string;
  id: number;
  title: string;
  url: string;
  thumbnailUrl?: string;
};

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

export type SimplifyArticleLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type VocabularyQuizResolvedLevel = SimplifyArticleLevel | 'C1';

export type SimplifyArticleTargetLength = 'short' | 'medium' | 'long';
export type SimplifyArticleTargetPercent = 10 | 25 | 50 | 75 | 100;

export type ArticleAdaptationSummary = {
  level: SimplifyArticleLevel;
  targetPercent: SimplifyArticleTargetPercent;
};

export type ArticleAdaptationsByArticleId = Record<
  string,
  ArticleAdaptationSummary[]
>;

export type ArticleQuizQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false';

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
  | 'translation'
  | 'definition'
  | 'cloze'
  | 'synonym';

export type ArticleVocabularyQuizQuestion = ArticleQuizQuestion & {
  format: ArticleVocabularyQuizQuestionFormat;
  sourceExcerpt?: string;
  term: string;
  termKind: 'word' | 'phrase';
  type: 'single_choice';
};

export type SimplifyArticleRequest = {
  articleId?: number;
  blocks?: ArticleBlock[];
  level?: SimplifyArticleLevel;
  targetPercent?: SimplifyArticleTargetPercent;
  text: string;
  title: string;
};

export type GenerateArticleQuizRequest = {
  level?: SimplifyArticleLevel;
  targetLength?: SimplifyArticleTargetLength;
  text: string;
  title: string;
};

export type GenerateArticleQuizResponse = {
  questions: ArticleQuizQuestion[];
};

export type GenerateArticleVocabularyQuizRequest = {
  level?: SimplifyArticleLevel;
  text: string;
  title: string;
};

export type GenerateArticleVocabularyQuizResponse = {
  questions: ArticleVocabularyQuizQuestion[];
  resolvedLevel: VocabularyQuizResolvedLevel;
};

export type ArticleQuizSessionResponse =
  | GenerateArticleQuizResponse
  | GenerateArticleVocabularyQuizResponse;

export type SimplifyArticleResponse = {
  adaptedBlocks: ArticleBlock[];
  adaptedLength: number;
  level: SimplifyArticleLevel;
  originalLength: number;
  questions?: ArticleQuizQuestion[];
  targetPercent: SimplifyArticleTargetPercent;
  title: string;
};
