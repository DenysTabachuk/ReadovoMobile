import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';

import { submitDictionaryTestAnswer } from '../../requests/submitDictionaryTestAnswer';

/**
 * Submits an answer on mutate and invalidates the user's dictionary on success.
 * Feedback formatting and test state remain with the caller. Failed submissions
 * leave the cache intact and reject mutateAsync.
 *
 * @returns Mutation controls accepting a word ID and selected option ID.
 * @example
 * const answer = useSubmitDictionaryTestAnswerMutation();
 * const result = await answer.mutateAsync({ wordId: 'word-7', selectedOptionId: 'option-2' });
 * // Use result for feedback; dictionary invalidation has already been requested.
 */
export function useSubmitDictionaryTestAnswerMutation() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitDictionaryTestAnswer,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['dictionary', 'words', userId],
      });
    },
  });
}
