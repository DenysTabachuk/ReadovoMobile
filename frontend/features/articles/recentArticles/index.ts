import AsyncStorage from '@react-native-async-storage/async-storage';

import { type WikipediaArticle, type WikipediaArticleDetail } from '@/api/wikipedia';

const RECENT_ARTICLES_STORAGE_KEY = 'readovo:recentArticles';
const RECENT_ARTICLES_LIMIT = 50;

export const RECENT_ARTICLES_QUERY_KEY = ['recentArticles'] as const;

export type RecentArticle = WikipediaArticle & {
  openedAt: string;
};

export function createRecentArticleFromDetail(
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

export function isArticleRecentlyOpened(
  articleId: number | null,
  recentArticles: RecentArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(recentArticles?.some((article) => article.id === articleId));
}

export async function readRecentArticles(): Promise<RecentArticle[]> {
  const storedValue = await AsyncStorage.getItem(RECENT_ARTICLES_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isStoredRecentArticle)
      .sort((left, right) => right.openedAt.localeCompare(left.openedAt));
  } catch {
    return [];
  }
}

export async function recordRecentArticle(
  article: WikipediaArticle,
): Promise<RecentArticle[]> {
  const recentArticles = await readRecentArticles();
  const nextRecentArticles = createRecentArticlesWithArticle(recentArticles, article);

  await writeRecentArticles(nextRecentArticles);

  return nextRecentArticles;
}

export function createRecentArticlesWithArticle(
  recentArticles: RecentArticle[] | undefined,
  article: WikipediaArticle,
): RecentArticle[] {
  return [
    {
      ...article,
      openedAt: new Date().toISOString(),
    },
    ...(recentArticles ?? []).filter((recentArticle) => recentArticle.id !== article.id),
  ].slice(0, RECENT_ARTICLES_LIMIT);
}

function createArticleExtract(content: string): string {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (compactContent.length <= 180) {
    return compactContent;
  }

  return `${compactContent.slice(0, 177).trim()}...`;
}

async function writeRecentArticles(recentArticles: RecentArticle[]): Promise<void> {
  await AsyncStorage.setItem(RECENT_ARTICLES_STORAGE_KEY, JSON.stringify(recentArticles));
}

function isStoredRecentArticle(value: unknown): value is RecentArticle {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const article = value as Partial<RecentArticle>;

  return (
    typeof article.id === 'number' &&
    typeof article.title === 'string' &&
    typeof article.extract === 'string' &&
    typeof article.url === 'string' &&
    typeof article.openedAt === 'string'
  );
}
