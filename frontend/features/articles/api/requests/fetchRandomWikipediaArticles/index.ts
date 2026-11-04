import { DEFAULT_ARTICLE_LIMIT } from '../../constants';
import type { WikipediaArticle } from '@/api/generated/transport';
import { fetchWikipediaArticles } from '../fetchWikipediaArticles';

export async function fetchRandomWikipediaArticles(
  limit = DEFAULT_ARTICLE_LIMIT,
): Promise<WikipediaArticle[]> {
  return fetchWikipediaArticles({ limit });
}
