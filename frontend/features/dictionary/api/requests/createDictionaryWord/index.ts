import { api } from '@/features/auth';

import {
  type CreateDictionaryWordRequest,
  type DictionaryWord,
} from '../../types';

export async function createDictionaryWord(
  request: CreateDictionaryWordRequest,
): Promise<DictionaryWord> {
  const response = await api.post<DictionaryWord>(
    `/api/dictionary/me/words`,
    request,
  );

  return response.data;
}
