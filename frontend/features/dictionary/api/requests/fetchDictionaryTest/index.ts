import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import { type DictionaryTest } from '../../types';

const DICTIONARY_TEST_QUESTION_LIMIT = 10;

export async function fetchDictionaryTest(): Promise<DictionaryTest> {
  const response = await api
    .get<DictionaryTest>(
      `/api/dictionary/me/test?limit=${DICTIONARY_TEST_QUESTION_LIMIT}`,
    )
    .catch(mapHttpError('dictionary.test.error'));

  return response.data;
}
