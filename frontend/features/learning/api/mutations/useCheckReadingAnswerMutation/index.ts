import { useMutation } from '@tanstack/react-query';
import { checkReadingAnswer } from '../../requests/checkReadingAnswer';

/**
 * Submits a reading-comprehension choice on demand.
 *
 * @returns Mutation state and actions for checking an answer.
 * @example
 * const { mutate } = useCheckReadingAnswerMutation();
 * mutate({ slug: 'oktoberfest', level: 'B2', questionId: 'rain', optionId: 'rainy' });
 */
export function useCheckReadingAnswerMutation() {
  return useMutation({ mutationFn: checkReadingAnswer });
}
