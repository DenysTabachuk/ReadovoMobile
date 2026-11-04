import { api } from '@/features/auth';

import { type DictionaryWord } from '@/api/generated/transport';

export async function fetchDictionaryWords(): Promise<DictionaryWord[]> {
  const response = await api.get<DictionaryWord[]>(`/api/dictionary/me/words`);

  return response.data;
}
