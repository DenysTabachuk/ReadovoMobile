import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import type { SavedArticle } from '../../../savedArticles/types';
import type { WikipediaArticle } from '../../types';

export async function saveArticleForLater(
  userId: string,
  article: WikipediaArticle,
): Promise<SavedArticle[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/users/${userId}/articles/saved`,
    {
      body: JSON.stringify(article),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('article.savedArticles.error');
  }

  return response.json() as Promise<SavedArticle[]>;
}
