import AsyncStorage from '@react-native-async-storage/async-storage';

import { type WikipediaArticle, type WikipediaArticleDetail } from '@/api/wikipedia';

const SAVED_ARTICLES_STORAGE_KEY = 'readovo:savedArticles';

export const SAVED_ARTICLES_QUERY_KEY = ['savedArticles'] as const;

export type SavedArticle = WikipediaArticle & {
  savedAt: string;
};

export function createSavedArticleFromDetail(
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

export function isArticleSaved(
  articleId: number | null,
  savedArticles: SavedArticle[] | undefined,
): boolean {
  if (articleId === null) {
    return false;
  }

  return Boolean(savedArticles?.some((article) => article.id === articleId));
}

export async function readSavedArticles(): Promise<SavedArticle[]> {
  const storedValue = await AsyncStorage.getItem(SAVED_ARTICLES_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isStoredSavedArticle);
  } catch {
    return [];
  }
}

export async function saveArticleForLater(
  article: WikipediaArticle,
): Promise<SavedArticle[]> {
  const savedArticles = await readSavedArticles();
  const nextSavedArticles = createSavedArticlesWithArticle(savedArticles, article);

  await writeSavedArticles(nextSavedArticles);

  return nextSavedArticles;
}

export async function removeSavedArticle(articleId: number): Promise<SavedArticle[]> {
  const savedArticles = await readSavedArticles();
  const nextSavedArticles = savedArticles.filter((article) => article.id !== articleId);

  await writeSavedArticles(nextSavedArticles);

  return nextSavedArticles;
}

export function createSavedArticlesWithArticle(
  savedArticles: SavedArticle[] | undefined,
  article: WikipediaArticle,
): SavedArticle[] {
  return [
    {
      ...article,
      savedAt: new Date().toISOString(),
    },
    ...(savedArticles ?? []).filter((savedArticle) => savedArticle.id !== article.id),
  ];
}

function createArticleExtract(content: string): string {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (compactContent.length <= 180) {
    return compactContent;
  }

  return `${compactContent.slice(0, 177).trim()}...`;
}

async function writeSavedArticles(savedArticles: SavedArticle[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_ARTICLES_STORAGE_KEY, JSON.stringify(savedArticles));
}

function isStoredSavedArticle(value: unknown): value is SavedArticle {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const article = value as Partial<SavedArticle>;

  return (
    typeof article.id === 'number' &&
    typeof article.title === 'string' &&
    typeof article.extract === 'string' &&
    typeof article.url === 'string' &&
    typeof article.savedAt === 'string'
  );
}
