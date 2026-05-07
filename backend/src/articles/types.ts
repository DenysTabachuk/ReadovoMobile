export type WikipediaArticle = {
  availableAdaptations?: ArticleAdaptationSummary[];
  id: number;
  title: string;
  extract: string;
  pageLength?: number;
  url: string;
  thumbnailUrl?: string;
};

export type GetWikipediaArticlesParams = {
  category?: WikipediaArticleCategory;
  excludeIds?: number[];
  limit?: number;
  previewLength?: WikipediaArticlePreviewLength;
  recommended?: boolean;
  search?: string;
};

export type WikipediaArticlePreviewLength = 'all' | 'short' | 'medium' | 'long';

export type WikipediaArticleCategory =
  | 'all'
  | 'biography'
  | 'history'
  | 'food'
  | 'geography'
  | 'science'
  | 'space'
  | 'sports'
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

export type ArticleSimplificationLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type ArticleSimplificationTargetLength = 'short' | 'medium' | 'long';
export type ArticleSimplificationTargetPercent = 10 | 25 | 50;

export type ArticleAdaptationSummary = {
  level: ArticleSimplificationLevel;
  targetPercent: ArticleSimplificationTargetPercent;
};

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

export type SimplifyArticleRequest = {
  articleId?: number;
  blocks?: ArticleBlock[];
  level?: string;
  targetPercent?: number | string;
  text?: string;
  title?: string;
};

export type GenerateArticleQuizRequest = {
  level?: string;
  targetLength?: string;
  text?: string;
  title?: string;
};

export type SimplifyArticleResponse = {
  adaptedBlocks: ArticleBlock[];
  adaptedLength: number;
  level: ArticleSimplificationLevel;
  originalLength: number;
  questions?: ArticleQuizQuestion[];
  targetPercent: ArticleSimplificationTargetPercent;
  title: string;
};

export type WikipediaPage = {
  extract?: string;
  fullurl?: string;
  length?: number;
  pageid: number;
  thumbnail?: {
    source?: string;
  };
  title: string;
};

export type WikipediaApiResponse = {
  query?: {
    pages?: Record<string, WikipediaPage>;
  };
};

export type SimplifiedArticleCacheRow = {
  adapted_blocks?: ArticleBlock[];
  adapted_length: number;
  adapted_text?: string;
  article_id?: number;
  questions?: ArticleQuizQuestion[];
  level: string;
  original_length: number;
  source_hash?: string;
  target_percent?: number;
  target_length: string;
  title: string;
};
