import type {
  ArticleAdaptationsByArticleId,
  WikipediaArticle,
} from '@/features/articles/api';
import type { ArticlePersonalFilter } from '../../components/articlesToolbar/types';

type DisplayedArticlesParams = {
  articles: WikipediaArticle[];
  savedArticles: WikipediaArticle[];
  recentArticles: WikipediaArticle[];
  personalFilter: ArticlePersonalFilter;
  personalArticleAdaptations: ArticleAdaptationsByArticleId;
};

/**
 * Select the article feed and fill missing adaptation metadata from loaded sources.
 *
 * @param params - Discover/saved/recent feeds, active personal filter, and fetched personal metadata.
 * @returns Articles in source order. Own metadata wins, then personal metadata, then discovery metadata;
 *   sources are not mutated and entries without adaptation data reuse their reference.
 * @example
 * resolveDisplayedArticles({ articles: [], savedArticles: [], recentArticles: [], personalFilter: null, personalArticleAdaptations: {} });
 * // => []
 */
export function resolveDisplayedArticles({
  articles,
  savedArticles,
  recentArticles,
  personalFilter,
  personalArticleAdaptations,
}: DisplayedArticlesParams): WikipediaArticle[] {
  const adaptations = new Map(
    articles
      .filter((article) => article.availableAdaptations?.length)
      .map((article) => [article.id, article.availableAdaptations]),
  );
  const source =
    personalFilter === 'saved'
      ? savedArticles
      : personalFilter === 'recent'
        ? recentArticles
        : articles;
  return source.map((article) => {
    const availableAdaptations =
      article.availableAdaptations ??
      personalArticleAdaptations[String(article.id)] ??
      adaptations.get(article.id);
    return availableAdaptations?.length
      ? { ...article, availableAdaptations }
      : article;
  });
}
