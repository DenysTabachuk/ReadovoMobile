import { useMutation } from '@tanstack/react-query';
import { retakeQuiz } from '../../requests/retakeQuiz';

export function useRetakeQuizMutation() {
  return useMutation({ mutationFn: retakeQuiz });
}
