import type {
  WikipediaArticle,
  WikipediaArticleDetail,
} from '../../api/wikipedia/types';
import { createArticleExtract } from '../createArticleExtract';

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
