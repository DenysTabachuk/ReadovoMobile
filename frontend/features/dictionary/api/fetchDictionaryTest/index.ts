import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import { type DictionaryTest } from '../types';

export async function fetchDictionaryTest(
  userId: string,
): Promise<DictionaryTest> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/users/${userId}/test?limit=10`,
  );

  if (!response.ok) {
    throw new Error('dictionary.test.error');
  }

  return response.json() as Promise<DictionaryTest>;
}
