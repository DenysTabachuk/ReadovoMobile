import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import {
  type CreateDictionaryWordRequest,
  type DictionaryWord,
} from '../../types';

const DUPLICATE_DICTIONARY_WORD_MESSAGE =
  'Word or phrase already exists in dictionary.';

export async function createDictionaryWord(
  userId: string,
  request: CreateDictionaryWordRequest,
): Promise<DictionaryWord> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/users/${userId}/words`,
    {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(await resolveCreateDictionaryWordError(response));
  }

  return response.json() as Promise<DictionaryWord>;
}

async function resolveCreateDictionaryWordError(
  response: Response,
): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    const message = Array.isArray(body.message)
      ? body.message[0]
      : body.message;

    if (message === DUPLICATE_DICTIONARY_WORD_MESSAGE) {
      return 'dictionary.alreadyExists';
    }
  } catch {
    // Fall back to the generic save error when the backend does not return JSON.
  }

  return 'dictionary.saveError';
}
