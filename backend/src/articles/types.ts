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
  content: string;
  id: number;
  title: string;
  url: string;
  thumbnailUrl?: string;
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
