import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useBanner } from '@/components/banner';
import { getDictionaryErrorMessageKey } from '../../../utils/getDictionaryErrorMessageKey';
import { useAuth } from '@/features/auth';

import { updateDictionaryWordProgress } from '../../requests/updateDictionaryWordProgress';
import type { DictionaryWordProgress } from '../../types';

type UseUpdateDictionaryWordProgressMutationParams = {
  onSuccess: () => void;
};

type UpdateDictionaryWordProgressVariables = {
  progress: DictionaryWordProgress;
  wordId: string;
};

const ERROR_BANNER_DURATION_MS = 4200;

/**
 * Updates a word's progress on mutate and refreshes dictionary and achievement data.
 * Calls the caller's UI callback before invalidating caches on success; failures
 * show an error banner and leave the caller's UI state intact.
 *
 * @param params - Callback for successful UI updates; the dictionary owner comes from authentication.
 * @returns Mutation controls accepting a word ID and the desired progress.
 * @example
 * // Inside a component:
 * const updateProgress = useUpdateDictionaryWordProgressMutation({ onSuccess: closeMenu });
 * updateProgress.mutate({ wordId: 'word-42', progress: 'in_progress' });
 * // After success, closes the menu and requests refreshed data.
 */
export function useUpdateDictionaryWordProgressMutation({
  onSuccess,
}: UseUpdateDictionaryWordProgressMutationParams) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { showBanner } = useBanner();

  return useMutation({
    mutationFn: ({ progress, wordId }: UpdateDictionaryWordProgressVariables) =>
      updateDictionaryWordProgress(wordId, { progress }),
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
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: ['achievements-profile', userId],
        });
      }
    },
  });
}
