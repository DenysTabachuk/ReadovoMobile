import type { WikipediaArticle } from '../api/types';

export type SavedArticle = WikipediaArticle & {
  savedAt: string;
};
