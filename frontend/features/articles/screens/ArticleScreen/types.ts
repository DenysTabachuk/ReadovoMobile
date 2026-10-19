import type {
  SimplifyArticleLevel,
  SimplifyArticleResponse,
} from '@/features/articles/api';

export type SelectedTextToken = {
  context: string;
  sentenceKey?: string;
  sentenceWordIndex?: number;
  text: string;
  tokenKey: string;
  word: string;
};
export type SelectedTextFragment = {
  context: string;
  text: string;
  tokenKeys: string[];
  words: string[];
};
export type TextComplexityMetrics = {
  averageSentenceWords: number;
  averageWordLength: number;
  characterCount: number;
  sentenceCount: number;
  wordCount: number;
};

export type ArticleTextViewMode = 'original' | 'adaptation' | 'summary';

export type ArticleSimplificationMetrics = {
  adapted: TextComplexityMetrics;
  original: TextComplexityMetrics;
};

export type ArticleTransformationDetails = {
  displayedArticle: SimplifyArticleResponse | null;
  latestGeneratedArticle: SimplifyArticleResponse | null;
  selectedLevel: SimplifyArticleLevel;
};
