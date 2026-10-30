import { useMutation } from '@tanstack/react-query';
import { retakeQuiz } from '../../requests/retakeQuiz';

export function useRetakeQuizMutation(onSuccess: (sessionId: string) => void) {
  return useMutation({ mutationFn: retakeQuiz, onSuccess });
}
