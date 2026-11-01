import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { createDictionaryWord } from '../../requests/createDictionaryWord';
import type { CreateDictionaryWordRequest } from '../../types';

/**
 * Persists a dictionary change and invalidates the initiating owner's cached data.
 * UI feedback belongs in the caller's mutate callbacks, which stop after unmount.
 * @returns Mutation controls accepting the resource data for this operation.
 * @example
 * const change = useCreateDictionaryWordMutation();
 * // Call change.mutate(variables, { onSuccess: closeDialog }) from the screen.
 */
export function useCreateDictionaryWordMutation() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateDictionaryWordRequest) =>
      createDictionaryWord(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', userId],
      });
    },
  });
}
