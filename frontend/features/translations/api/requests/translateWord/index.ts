import { httpClient } from '@/api/httpClient';
import { API_BASE_URL } from '@/api';

import {
  type TranslateWordRequest,
  type TranslateWordResponse,
} from '../../types';

export async function translateWord(
  request: TranslateWordRequest,
): Promise<TranslateWordResponse> {
  const { data } = await httpClient.post<TranslateWordResponse>(
    `${API_BASE_URL}/api/translations/word`,
    request,
  );

  return data;
}
