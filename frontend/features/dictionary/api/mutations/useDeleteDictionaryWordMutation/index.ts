import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useBanner } from '@/components/banner';
import { useAuth } from '@/features/auth';

import { deleteDictionaryWord } from '../../requests/deleteDictionaryWord';
import { getDictionaryErrorMessageKey } from '../../../utils/getDictionaryErrorMessageKey';

type UseDeleteDictionaryWordMutationParams = {
  onSuccess: () => void;
};

const ERROR_BANNER_DURATION_MS = 4200;
const SUCCESS_BANNER_DURATION_MS = 3200;

/**
 * Deletes a word on mutate, calls the caller's UI callback, then invalidates the
 * owner's dictionary cache and shows a success banner. Failures show an error
 * banner without invoking the callback or invalidating cached data.
 *
 * @param params - Callback for successful UI updates; the dictionary owner comes from authentication.
 * @returns Mutation controls accepting the ID of the word to delete.
 * @example
 * // Inside a component:
 * const deleteWord = useDeleteDictionaryWordMutation({ onSuccess: closeWordDialogs });
 * deleteWord.mutate('word-42');
 * // Closes the dialogs after deletion succeeds; leaves them open on failure.
 */
export function useDeleteDictionaryWordMutation({
  onSuccess,
}: UseDeleteDictionaryWordMutationParams) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showBanner } = useBanner();

  return useMutation({
    mutationFn: (wordId: string) => deleteDictionaryWord(wordId),
    onError: (error) => {
      const messageKey = getDictionaryErrorMessageKey(error);
      if (!messageKey) return;
      showBanner({
        durationMs: ERROR_BANNER_DURATION_MS,
        title: t(messageKey),
        variant: 'error',
      });
    },
    onSuccess: () => {
      onSuccess();
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', userId],
      });
      showBanner({
        durationMs: SUCCESS_BANNER_DURATION_MS,
        title: t('dictionary.deleted'),
        variant: 'success',
      });
    },
  });
}
