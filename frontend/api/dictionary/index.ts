import { authenticatedFetch } from '@/api/auth/authenticatedFetch';
import { API_BASE_URL } from '@/api/auth/constants';

import {
  type CreateDictionaryWordRequest,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryWord,
  type SubmitDictionaryTestAnswerRequest,
  type UpdateDictionaryWordProgressRequest,
} from './types';

const DUPLICATE_DICTIONARY_WORD_MESSAGE =
  'Word or phrase already exists in dictionary.';

export type {
  CreateDictionaryWordRequest,
  DictionaryTest,
  DictionaryTestAnswerResult,
  DictionaryTestQuestionFormat,
  DictionaryTestQuestion,
  DictionaryTestQuestionOption,
  DictionaryWord,
  DictionaryWordProgress,
  SubmitDictionaryTestAnswerRequest,
  UpdateDictionaryWordProgressRequest,
} from './types';

export async function fetchDictionaryWords(userId: string): Promise<DictionaryWord[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/dictionary/users/${userId}/words`);

  if (!response.ok) {
    throw new Error('dictionary.error');
  }

  return response.json() as Promise<DictionaryWord[]>;
}

export async function createDictionaryWord(
  userId: string,
  request: CreateDictionaryWordRequest,
): Promise<DictionaryWord> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/dictionary/users/${userId}/words`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

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

export async function deleteDictionaryWord(
  userId: string,
  wordId: string,
): Promise<DictionaryWord> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/users/${userId}/words/${wordId}`,
    {
      method: 'DELETE',
    },
  );

  if (!response.ok) {
    throw new Error('dictionary.deleteError');
  }

  return response.json() as Promise<DictionaryWord>;
}

export async function fetchDictionaryTest(userId: string): Promise<DictionaryTest> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/dictionary/users/${userId}/test?limit=10`);

  if (!response.ok) {
    throw new Error('dictionary.test.error');
  }

  return response.json() as Promise<DictionaryTest>;
}

export async function submitDictionaryTestAnswer(
  userId: string,
  request: SubmitDictionaryTestAnswerRequest,
): Promise<DictionaryTestAnswerResult> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/dictionary/users/${userId}/test/answer`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('dictionary.test.answerError');
  }

  return response.json() as Promise<DictionaryTestAnswerResult>;
}

export async function updateDictionaryWordProgress(
  userId: string,
  wordId: string,
  request: UpdateDictionaryWordProgressRequest,
): Promise<DictionaryWord> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/dictionary/users/${userId}/words/${wordId}/progress`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error('dictionary.progressUpdateError');
  }

  return response.json() as Promise<DictionaryWord>;
}
