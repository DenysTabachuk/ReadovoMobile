import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import { type DictionaryWord } from '../../types';

export async function fetchDictionaryWords(): Promise<DictionaryWord[]> {
  const response = await api
    .get<DictionaryWord[]>(`/api/dictionary/me/words`)
    .catch(mapHttpError('dictionary.error'));

  return response.data;
}
