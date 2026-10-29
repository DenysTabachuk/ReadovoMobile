import { api } from '@/features/auth';

import {
  type DictionaryTestAnswerResult,
  type SubmitDictionaryTestAnswerRequest,
} from '../../types';

export async function submitDictionaryTestAnswer(
  request: SubmitDictionaryTestAnswerRequest,
): Promise<DictionaryTestAnswerResult> {
  const response = await api.post<DictionaryTestAnswerResult>(
    `/api/dictionary/me/test/answer`,
    request,
  );

  return response.data;
}
