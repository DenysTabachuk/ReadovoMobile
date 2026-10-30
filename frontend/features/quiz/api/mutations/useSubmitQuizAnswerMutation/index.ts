import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { submitQuizAnswer } from '../../requests/submitQuizAnswer';

export function useSubmitQuizAnswerMutation() {
  const { currentUser } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: submitQuizAnswer,
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ['dictionary', 'words', currentUser?.id],
      });
      // A verified dictionary answer can unlock a learned-word achievement.
      void client.invalidateQueries({
        queryKey: ['achievements-profile', currentUser?.id],
      });
      void client.invalidateQueries({
        queryKey: ['streak-profile', currentUser?.id],
      });
    },
  });
}
