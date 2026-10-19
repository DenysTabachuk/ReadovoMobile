import type { WikipediaArticle } from '../api/types';

export type RecentArticle = WikipediaArticle & {
  openedAt: string;
};
