import { mapHttpError } from '@/api/utils/mapHttpError';

import { api } from '@/features/auth';

import { type DictionaryWord } from '../../types';

export async function deleteDictionaryWord(
  wordId: string,
): Promise<DictionaryWord> {
  const response = await api
    .delete<DictionaryWord>(`/api/dictionary/me/words/${wordId}`)
    .catch(mapHttpError('dictionary.deleteError'));

  return response.data;
}
