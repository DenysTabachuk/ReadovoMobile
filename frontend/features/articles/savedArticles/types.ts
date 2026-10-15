import type { WikipediaArticle } from '../api/wikipedia/types';

export type SavedArticle = WikipediaArticle & {
  savedAt: string;
};
