export type WikipediaArticle = {
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

export type WikipediaArticlePreviewLength =
  | 'all'
  | 'short'
  | 'medium'
  | 'long';

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
  level?: string;
  targetLength?: string;
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
  adaptedLength: number;
  adaptedBlocks?: ArticleBlock[];
  adaptedText: string;
  level: ArticleSimplificationLevel;
  originalLength: number;
  questions?: ArticleQuizQuestion[];
  targetLength: ArticleSimplificationTargetLength;
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
  adapted_length: number;
  adapted_text: string;
  level: string;
  original_length: number;
  target_length: string;
  title: string;
};
