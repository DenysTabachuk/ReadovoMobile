import { api } from '@/features/auth';

import {
  type DictionaryWord,
  type UpdateDictionaryWordProgressRequest,
} from '../../types';

export async function updateDictionaryWordProgress(
  wordId: string,
  request: UpdateDictionaryWordProgressRequest,
): Promise<DictionaryWord> {
  const response = await api.patch<DictionaryWord>(
    `/api/dictionary/me/words/${wordId}/progress`,
    request,
  );

  return response.data;
}
