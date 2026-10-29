import { api } from '@/features/auth';

import { type DictionaryWord } from '../../types';

export async function deleteDictionaryWord(
  wordId: string,
): Promise<DictionaryWord> {
  const response = await api.delete<DictionaryWord>(
    `/api/dictionary/me/words/${wordId}`,
  );

  return response.data;
}
