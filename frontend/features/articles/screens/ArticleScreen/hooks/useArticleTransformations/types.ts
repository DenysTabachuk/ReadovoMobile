import type {
  SimplifyArticleLevel,
  SimplifyArticleResponse,
} from '@/features/articles/api';
import type { ArticleTextViewMode } from '../../types';

export type ArticleTransformationsState = {
  generatedArticles: Record<string, SimplifyArticleResponse>;
  selectedLevel: SimplifyArticleLevel;
  selectedTextViewMode: ArticleTextViewMode;
  latestGeneratedKey: string | null;
};

export type ArticleTransformationsAction =
  | { type: 'generated'; article: SimplifyArticleResponse }
  | { type: 'levelChanged'; level: SimplifyArticleLevel }
  | { type: 'modeChanged'; mode: ArticleTextViewMode };
