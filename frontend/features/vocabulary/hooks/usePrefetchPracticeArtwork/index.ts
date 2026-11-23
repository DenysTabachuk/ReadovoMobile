import { useMemo } from 'react';
import type { VocabularyPracticeQuestion } from '@/api/generated/transport';
import { usePrefetchLearningMedia } from '@/features/learningMedia';

type PracticeArtworkScope = 'preview' | 'session' | 'inactive';

/**
 * Warms the first picture question from the overview and the full set in practice.
 * @param questions - Ordered questions for the selected lesson variant.
 * @param scope - Preview the first images, retain all during practice, or disable prefetch.
 * @example usePrefetchPracticeArtwork(questions, 'session'); // Loads images in first-use order.
 */
export function usePrefetchPracticeArtwork(
  questions: readonly VocabularyPracticeQuestion[],
  scope: PracticeArtworkScope,
) {
  const imageUrls = useMemo(() => {
    if (scope === 'inactive') return [];
    const urls = new Set<string>();
    for (const question of questions) {
      if (question.kind === 'sentence_gap') continue;
      for (const { imageUrl } of question.options) {
        if (imageUrl !== null) urls.add(imageUrl);
      }
      if (scope === 'preview' && urls.size > 0) break;
    }
    return [...urls];
  }, [questions, scope]);
  usePrefetchLearningMedia(imageUrls, scope === 'session');
}
