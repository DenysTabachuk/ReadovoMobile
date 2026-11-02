import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import type { QuizSessionResult } from '../../../types';
import { completeQuiz } from '../../requests/completeQuiz';

/**
 * Completes a server quiz and invalidates authoritative data for its owner.
 * UI results and reward banners belong in the caller's mutate callbacks.
 * @param sessionId - Saved server quiz session; missing IDs reject before transport.
 * @returns Mutation accepting local timing and returning the confirmed response.
 * @example
 * const completion = useCompleteQuizMutation(sessionId);
 * completion.mutate(localResult, feedback); // Refetches owned data after success.
 */
export function useCompleteQuizMutation(sessionId?: string) {
  const { currentUser } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (localResult: QuizSessionResult) => {
      if (!sessionId || !currentUser?.id)
        throw new Error('Missing quiz session.');
      const response = await completeQuiz(sessionId);
      if (response.sessionId !== sessionId)
        throw new Error('Unexpected quiz session.');
      return { response, durationSeconds: localResult.durationSeconds };
    },
    onSuccess: ({ response }) => {
      const owner = response.profile.userId;
      // Refetch instead of overwriting newer state from another operation.
      void client.invalidateQueries({
        queryKey: ['achievements-profile', owner],
      });
      void client.invalidateQueries({ queryKey: ['streak-profile', owner] });
      void client.invalidateQueries({
        queryKey: ['streak-calendar-month', owner],
      });
      void client.invalidateQueries({
        queryKey: ['dictionary', 'words', owner],
      });
    },
  });
}
