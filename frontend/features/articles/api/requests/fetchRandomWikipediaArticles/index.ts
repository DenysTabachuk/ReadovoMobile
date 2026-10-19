import { DEFAULT_ARTICLE_LIMIT } from '../../constants';
import type { WikipediaArticle } from '../../types';
import { fetchWikipediaArticles } from '../fetchWikipediaArticles';

export async function fetchRandomWikipediaArticles(
  limit = DEFAULT_ARTICLE_LIMIT,
): Promise<WikipediaArticle[]> {
  return fetchWikipediaArticles({ limit });
}
