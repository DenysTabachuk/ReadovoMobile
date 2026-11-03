import { useQuery } from '@tanstack/react-query';

import {
  translateWord,
  type TranslateWordRequest,
  type TranslateWordResponse,
} from '../api';

type UseWordTranslationParams = Pick<
  TranslateWordRequest,
  'sourceLanguage' | 'targetLanguage'
> & {
  context?: string;
  enabled: boolean;
  queryScope: string;
  word?: string;
};

export function useWordTranslation({
  context,
  enabled,
  queryScope,
  sourceLanguage,
  targetLanguage,
  word,
}: UseWordTranslationParams) {
  return useQuery<TranslateWordResponse>({
    enabled: enabled && Boolean(word),
    queryFn: async () => {
      if (!word) {
        throw new Error('Translation request requires a word.');
      }

      return translateWord({
        context,
        sourceLanguage,
        targetLanguage,
        word,
      });
    },
    queryKey: [
      'translation',
      queryScope,
      word ?? '',
      context ?? '',
      // null marks the server's default direction without duplicating its policy.
      sourceLanguage ?? null,
      targetLanguage ?? null,
    ],
  });
}
