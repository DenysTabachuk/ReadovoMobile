import { useBanner } from '@/components/banner';
import { useAuth } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createDictionaryWord } from '../../requests/createDictionaryWord';
import type { CreateDictionaryWordRequest } from '../../types';

/**
 * Saves a word to the authenticated user's dictionary on mutate. Success refreshes
 * that user's dictionary and shows a banner; duplicate words show an info banner.
 *
 * @returns Mutation controls accepting the word, translation, and context.
 * @example
 * // Inside a component:
 * const saveWord = useCreateDictionaryWordMutation();
 * saveWord.mutate({ word: 'sun', translation: 'сонце', context: 'The sun rises.' });
 * // After saving, requests refreshed dictionary data and shows a success banner.
 */
export function useCreateDictionaryWordMutation() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDictionaryWordRequest) =>
      createDictionaryWord(request),
    onError: (mutationError) => {
      const errorKey =
        mutationError instanceof Error
          ? mutationError.message
          : 'dictionary.saveError';

      showBanner({
        title: t(errorKey, { defaultValue: t('dictionary.saveError') }),
        variant: errorKey === 'dictionary.alreadyExists' ? 'info' : 'error',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', currentUser?.id],
      });
      showBanner({
        title: t('dictionary.saved'),
        variant: 'success',
      });
    },
  });
}
