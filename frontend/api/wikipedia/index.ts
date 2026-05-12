import { API_BASE_URL } from '@/api/auth/constants';

import { DEFAULT_ARTICLE_LIMIT } from './constants';
import {
  type FetchWikipediaArticlesParams,
  type ArticleAdaptationsByArticleId,
  type GenerateArticleQuizRequest,
  type GenerateArticleQuizResponse,
  type GenerateArticleVocabularyQuizRequest,
  type GenerateArticleVocabularyQuizResponse,
  type ArticleQuizSessionResponse,
  type SimplifyArticleRequest,
  type SimplifyArticleResponse,
  type WikipediaArticle,
  type WikipediaArticleDetail,
} from './types';

const ARTICLE_QUIZ_GENERATION_TIMEOUT_MS = 60000;

export type {
  ArticleBlock,
  ArticleAdaptationSummary,
  ArticleAdaptationsByArticleId,
  ArticleQuizQuestion,
  ArticleQuizQuestionOption,
  ArticleQuizQuestionType,
  ArticleQuizSessionResponse,
  ArticleTextTransformationType,
  ArticleVocabularyQuizQuestion,
  ArticleVocabularyQuizQuestionFormat,
  FetchWikipediaArticlesParams,
  InlineNode,
  SimplifyArticleLevel,
  GenerateArticleQuizRequest,
  GenerateArticleQuizResponse,
  GenerateArticleVocabularyQuizRequest,
  GenerateArticleVocabularyQuizResponse,
  SimplifyArticleRequest,
  SimplifyArticleResponse,
  SimplifyArticleTargetLength,
  TableCell,
  WikipediaArticle,
  WikipediaArticleCategory,
  WikipediaArticleDetail,
  WikipediaArticlePreviewLength,
} from './types';

export async function fetchWikipediaArticles(
  params: FetchWikipediaArticlesParams = {},
): Promise<WikipediaArticle[]> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit ?? DEFAULT_ARTICLE_LIMIT),
  });

  if (params.search?.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }

  if (params.excludeIds?.length) {
    searchParams.set('excludeIds', params.excludeIds.join(','));
  }

  if (params.previewLength && params.previewLength !== 'all') {
    searchParams.set('previewLength', params.previewLength);
  }

  if (params.recommended !== undefined) {
    searchParams.set('recommended', String(params.recommended));
  }

  const response = await fetch(`${API_BASE_URL}/articles?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('articles.errorDescription');
  }

  return response.json() as Promise<WikipediaArticle[]>;
}

export async function fetchRandomWikipediaArticles(
  limit = DEFAULT_ARTICLE_LIMIT
): Promise<WikipediaArticle[]> {
  return fetchWikipediaArticles({ limit });
}

export async function fetchWikipediaArticleDetail(
  pageId: number,
  languageCode = 'en',
): Promise<WikipediaArticleDetail> {
  const params = new URLSearchParams({
    languageCode,
  });
  const response = await fetch(
    `${API_BASE_URL}/articles/${pageId}?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error('article.errorDescription');
  }

  return response.json() as Promise<WikipediaArticleDetail>;
}

export async function fetchArticleAdaptations(
  articleIds: number[],
  transformationType?: 'adaptation' | 'summary' | 'all',
): Promise<ArticleAdaptationsByArticleId> {
  if (articleIds.length === 0) {
    return {};
  }

  const searchParams = new URLSearchParams({
    articleIds: Array.from(new Set(articleIds)).join(','),
  });

  if (transformationType) {
    searchParams.set('transformationType', transformationType);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/articles/adaptations?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error('articles.errorDescription');
  }

  return response.json() as Promise<ArticleAdaptationsByArticleId>;
}

export async function simplifyWikipediaArticle(
  request: SimplifyArticleRequest
): Promise<SimplifyArticleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/articles/simplify`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    let errorMessage = 'article.adaptError';

    try {
      const errorBody = (await response.json()) as {
        message?: string | string[];
      };
      const backendMessage = Array.isArray(errorBody.message)
        ? errorBody.message[0]
        : errorBody.message;

      if (backendMessage) {
        errorMessage = `${errorMessage}: ${backendMessage}`;
      }
    } catch {
      // Ignore malformed error bodies and fall back to the localized message key.
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<SimplifyArticleResponse>;
}

export async function generateArticleQuiz(
  request: GenerateArticleQuizRequest
): Promise<GenerateArticleQuizResponse> {
  return generateArticleQuizRequest('/api/articles/quiz', request);
}

export async function generateArticleVocabularyQuiz(
  request: GenerateArticleVocabularyQuizRequest
): Promise<GenerateArticleVocabularyQuizResponse> {
  return generateArticleQuizRequest('/api/articles/vocabulary-quiz', request);
}

async function generateArticleQuizRequest<
  TRequest extends GenerateArticleQuizRequest | GenerateArticleVocabularyQuizRequest,
  TResponse extends ArticleQuizSessionResponse,
>(path: string, request: TRequest): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    ARTICLE_QUIZ_GENERATION_TIMEOUT_MS,
  );

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    });
  } catch {
    throw new Error('article.quiz.error');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error('article.quiz.error');
  }

  return response.json() as Promise<TResponse>;
}
