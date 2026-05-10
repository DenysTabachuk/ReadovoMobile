import { API_BASE_URL } from '@/api/auth/constants';

import {
  type CreateDictionaryWordRequest,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryWord,
  type SubmitDictionaryTestAnswerRequest,
  type UpdateDictionaryWordProgressRequest,
} from './types';

export type {
  CreateDictionaryWordRequest,
  DictionaryTest,
  DictionaryTestAnswerResult,
  DictionaryTestQuestion,
  DictionaryTestQuestionOption,
  DictionaryWord,
  DictionaryWordProgress,
  SubmitDictionaryTestAnswerRequest,
  UpdateDictionaryWordProgressRequest,
} from './types';

export async function fetchDictionaryWords(userId: string): Promise<DictionaryWord[]> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/users/${userId}/words`);

  if (!response.ok) {
    throw new Error('dictionary.error');
  }

  return response.json() as Promise<DictionaryWord[]>;
}

export async function createDictionaryWord(
  userId: string,
  request: CreateDictionaryWordRequest,
): Promise<DictionaryWord> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/users/${userId}/words`, {
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

export async function fetchDictionaryTest(userId: string): Promise<DictionaryTest> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/users/${userId}/test?limit=10`);

  if (!response.ok) {
    throw new Error('dictionary.test.error');
  }

  return response.json() as Promise<DictionaryTest>;
}

export async function submitDictionaryTestAnswer(
  userId: string,
  request: SubmitDictionaryTestAnswerRequest,
): Promise<DictionaryTestAnswerResult> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/users/${userId}/test/answer`, {
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
  const response = await fetch(`${API_BASE_URL}/api/dictionary/users/${userId}/words/${wordId}/progress`, {
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
