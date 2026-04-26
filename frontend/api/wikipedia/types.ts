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
