import { mapHttpError } from '@/api/utils/mapHttpError';
import { type HttpError } from '@/api/httpError';

import { api } from '@/features/auth';

import {
  type CreateDictionaryWordRequest,
  type DictionaryWord,
} from '../../types';

const DUPLICATE_DICTIONARY_WORD_MESSAGE =
  'Word or phrase already exists in dictionary.';

export async function createDictionaryWord(
  request: CreateDictionaryWordRequest,
): Promise<DictionaryWord> {
  const response = await api
    .post<DictionaryWord>(`/api/dictionary/me/words`, request)
    .catch(
      mapHttpError('dictionary.saveError', {
        resolveMessage: resolveCreateDictionaryWordError,
      }),
    );

  return response.data;
}

async function resolveCreateDictionaryWordError(
  response: HttpError['response'],
): Promise<string> {
  try {
    const body = response.data as { message?: unknown };
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
