import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import {
  type DictionaryWord,
  type UpdateDictionaryWordProgressRequest,
} from '../../types';

export async function updateDictionaryWordProgress(
  wordId: string,
  request: UpdateDictionaryWordProgressRequest,
): Promise<DictionaryWord> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/me/words/${wordId}/progress`,
    {
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    },
  );

  if (!response.ok) {
    throw new Error('dictionary.progressUpdateError');
  }

  return response.json() as Promise<DictionaryWord>;
}
