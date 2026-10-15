import type { WikipediaArticle } from '../api/wikipedia/types';

export type RecentArticle = WikipediaArticle & {
  openedAt: string;
};
