import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import { type DictionaryWord } from '../../types';

export async function fetchDictionaryWords(): Promise<DictionaryWord[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/me/words`,
  );

  if (!response.ok) {
    throw new Error('dictionary.error');
  }

  return response.json() as Promise<DictionaryWord[]>;
}
