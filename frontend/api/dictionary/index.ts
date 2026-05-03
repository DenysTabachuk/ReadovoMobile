import { API_BASE_URL } from '@/api/auth/constants';

import {
  type CreateDictionaryWordRequest,
  type DictionaryTest,
  type DictionaryTestAnswerResult,
  type DictionaryWord,
  type SubmitDictionaryTestAnswerRequest,
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

export async function fetchDictionaryTest(): Promise<DictionaryTest> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/test?limit=10`);

  if (!response.ok) {
    throw new Error('dictionary.test.error');
  }

  return response.json() as Promise<DictionaryTest>;
}

export async function submitDictionaryTestAnswer(
  request: SubmitDictionaryTestAnswerRequest,
): Promise<DictionaryTestAnswerResult> {
  const response = await fetch(`${API_BASE_URL}/api/dictionary/test/answer`, {
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
