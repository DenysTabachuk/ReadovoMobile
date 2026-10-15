import { API_BASE_URL } from '@/api';
import { authenticatedFetch } from '@/features/auth';

import {
  type DictionaryTestAnswerResult,
  type SubmitDictionaryTestAnswerRequest,
} from '../types';

export async function submitDictionaryTestAnswer(
  userId: string,
  request: SubmitDictionaryTestAnswerRequest,
): Promise<DictionaryTestAnswerResult> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/dictionary/users/${userId}/test/answer`,
    {
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error('dictionary.test.answerError');
  }

  return response.json() as Promise<DictionaryTestAnswerResult>;
}
