import {
  keepPreviousData,
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { fetchWikipediaArticles } from '../../requests';
import type {
  FetchWikipediaArticlesParams,
  WikipediaArticle,
} from '../../types';

type WikipediaArticlesQueryParams = Omit<
  FetchWikipediaArticlesParams,
  'excludeIds'
>;

export function useWikipediaArticlesQuery(
  params: WikipediaArticlesQueryParams,
) {
  return useInfiniteQuery<
    WikipediaArticle[],
    Error,
    InfiniteData<WikipediaArticle[], number[]>,
    QueryKey,
    number[]
  >({
    initialPageParam: [] as number[],
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 0
        ? undefined
        : pages.flat().map((article) => article.id),
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      fetchWikipediaArticles({ ...params, excludeIds: pageParam }),
    queryKey: ['wikipedia', 'articles', params],
  });
}
