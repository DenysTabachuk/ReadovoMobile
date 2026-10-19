import type { WikipediaArticle, WikipediaArticleDetail } from '../../api/types';
import { createArticleExtract } from '../createArticleExtract';

/**
 * Convert article details into the preview shape shared by saved and recent lists.
 *
 * @param article - Full article details with content and metadata.
 * @returns A new preview with a compact extract and the original ID, title, URL, and
 *   optional thumbnail; input is not mutated.
 * @example
 * createArticlePreviewFromDetail({ id: 42, title: 'Space', url: 'https://example.com/42', content: 'Hello', blocks: [] });
 * // => { extract: 'Hello', id: 42, thumbnailUrl: undefined, title: 'Space', url: 'https://example.com/42' }
 */
export function createArticlePreviewFromDetail(
  article: WikipediaArticleDetail,
): WikipediaArticle {
  return {
    extract: createArticleExtract(article.content),
    id: article.id,
    thumbnailUrl: article.thumbnailUrl,
    title: article.title,
    url: article.url,
  };
}
