export type WikipediaArticle = {
  id: number;
  title: string;
  extract: string;
  url: string;
  thumbnailUrl?: string;
};

export type FetchWikipediaArticlesParams = {
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
  | {
      alt?: string;
      caption?: string;
      src: string;
      type: 'image';
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

export type SimplifyArticleTargetLength = 'short' | 'medium';

export type SimplifyArticleRequest = {
  level?: SimplifyArticleLevel;
  targetLength?: SimplifyArticleTargetLength;
  text: string;
  title: string;
};

export type SimplifyArticleResponse = {
  adaptedLength: number;
  adaptedText: string;
  level: SimplifyArticleLevel;
  originalLength: number;
  targetLength: SimplifyArticleTargetLength;
  title: string;
};
