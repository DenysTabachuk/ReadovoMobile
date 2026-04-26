export type WikipediaArticle = {
  id: number;
  title: string;
  extract: string;
  url: string;
  thumbnailUrl?: string;
};

export type WikipediaArticleDetail = {
  content: string;
  id: number;
  title: string;
  url: string;
  thumbnailUrl?: string;
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
