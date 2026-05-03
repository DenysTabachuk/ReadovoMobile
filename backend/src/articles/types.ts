export type WikipediaArticle = {
  id: number;
  title: string;
  extract: string;
  url: string;
  thumbnailUrl?: string;
};

export type GetWikipediaArticlesParams = {
  category?: WikipediaArticleCategory;
  limit?: number;
  search?: string;
};

export type WikipediaArticleCategory =
  | 'all'
  | 'history'
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

export type ArticleSimplificationLevel = 'A1' | 'A2' | 'B1' | 'B2';

export type ArticleSimplificationTargetLength = 'short' | 'medium';

export type SimplifyArticleRequest = {
  level?: string;
  targetLength?: string;
  text?: string;
  title?: string;
};

export type SimplifyArticleResponse = {
  adaptedLength: number;
  adaptedText: string;
  level: ArticleSimplificationLevel;
  originalLength: number;
  targetLength: ArticleSimplificationTargetLength;
  title: string;
};

export type WikipediaPage = {
  extract?: string;
  fullurl?: string;
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
