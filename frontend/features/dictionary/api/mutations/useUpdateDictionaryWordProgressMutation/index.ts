import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { updateDictionaryWordProgress } from '../../requests/updateDictionaryWordProgress';
import type { DictionaryWordProgress } from '../../types';

type UpdateDictionaryWordProgressVariables = {
  progress: DictionaryWordProgress;
  wordId: string;
};

/**
 * Persists a dictionary change and invalidates the initiating owner's cached data.
 * UI feedback belongs in the caller's mutate callbacks, which stop after unmount.
 * @returns Mutation controls accepting the resource data for this operation.
 * @example
 * const change = useUpdateDictionaryWordProgressMutation();
 * // Call change.mutate(variables, { onSuccess: closeDialog }) from the screen.
 */
export function useUpdateDictionaryWordProgressMutation() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ progress, wordId }: UpdateDictionaryWordProgressVariables) =>
      updateDictionaryWordProgress(wordId, { progress }),
    onSuccess: () => {
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
