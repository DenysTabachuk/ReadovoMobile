import { API_BASE_URL } from '@/api/auth/constants';

import {
  type TranslateWordRequest,
  type TranslateWordResponse,
} from './types';

export type { TranslateWordRequest, TranslateWordResponse } from './types';

export async function translateWord(
  request: TranslateWordRequest,
): Promise<TranslateWordResponse> {
  const response = await fetch(`${API_BASE_URL}/api/translations/word`, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('translation.error');
  }

  return response.json() as Promise<TranslateWordResponse>;
}
