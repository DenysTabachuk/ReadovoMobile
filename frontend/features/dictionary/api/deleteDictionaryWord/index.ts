import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import { type DictionaryWord } from '../types';

export async function deleteDictionaryWord(
  userId: string,
  wordId: string,
): Promise<DictionaryWord> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/users/${userId}/words/${wordId}`,
    { method: 'DELETE' },
  );

  if (!response.ok) {
    throw new Error('dictionary.deleteError');
  }

  return response.json() as Promise<DictionaryWord>;
}
