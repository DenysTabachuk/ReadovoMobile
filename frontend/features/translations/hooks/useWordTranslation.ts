import { useQuery } from '@tanstack/react-query';

import { translateWord, type TranslateWordResponse } from '@/api/translations';

type UseWordTranslationParams = {
  context?: string;
  enabled: boolean;
  queryScope: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  word?: string;
};

export function useWordTranslation({
  context,
  enabled,
  queryScope,
  sourceLanguage = 'en',
  targetLanguage = 'uk',
  word,
}: UseWordTranslationParams) {
  return useQuery<TranslateWordResponse>({
    enabled: enabled && Boolean(word),
    queryFn: async () => {
      if (!word) {
        throw new Error('translation.error');
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
      sourceLanguage,
      targetLanguage,
    ],
  });
}
