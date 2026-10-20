import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import { type DictionaryTest } from '../../types';

const DICTIONARY_TEST_QUESTION_LIMIT = 10;

export async function fetchDictionaryTest(): Promise<DictionaryTest> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/me/test?limit=${DICTIONARY_TEST_QUESTION_LIMIT}`,
  );

  if (!response.ok) {
    throw new Error('dictionary.test.error');
  }

  return response.json() as Promise<DictionaryTest>;
}
