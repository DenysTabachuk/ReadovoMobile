import { useMutation } from '@tanstack/react-query';
import type { VocabularyLevel } from '@/api/generated/transport';
import { useAuthenticatedUser } from '@/features/auth';
import { checkVocabularyAnswer } from '../../requests/checkVocabularyAnswer';
import type { VocabularyAnswerSubmission } from '../../types';

export function useCheckVocabularyAnswerMutation(
  slug: string,
  level: VocabularyLevel,
) {
  const { id } = useAuthenticatedUser();
  return useMutation({
    mutationKey: ['learning', id, 'vocabulary-check', slug, level],
    mutationFn: (submission: VocabularyAnswerSubmission) =>
      checkVocabularyAnswer(slug, level, submission),
  });
}
