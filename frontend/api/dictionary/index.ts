import { API_BASE_URL } from '@/api/auth/constants';

import {
  type CreateDictionaryWordRequest,
  type DictionaryWord,
} from './types';

export type {
  CreateDictionaryWordRequest,
  DictionaryWord,
  DictionaryWordProgress,
} from './types';

export async function fetchDictionaryWords(): Promise<DictionaryWord[]> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/words`);

  if (!response.ok) {
    throw new Error('dictionary.error');
  }

  return response.json() as Promise<DictionaryWord[]>;
}

export async function createDictionaryWord(
  request: CreateDictionaryWordRequest,
): Promise<DictionaryWord> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/words`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('dictionary.saveError');
  }

  return response.json() as Promise<DictionaryWord>;
}
