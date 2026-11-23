import { queryOptions, useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';
import { getLearningMedia } from '../../requests/getLearningMedia';

// Limit how long unused Base64 artwork occupies the in-memory query cache.
const IMAGE_GC_TIME_MS = 60 * 1000;

export function learningMediaQueryOptions(userId: string, imageUrl: string) {
  return queryOptions({
    queryKey: ['learning', userId, 'media', imageUrl],
    queryFn: ({ signal }) => getLearningMedia(imageUrl, signal),
    retry: false,
    gcTime: IMAGE_GC_TIME_MS,
    // Replacements have new URLs, so mounted readers can reuse prefetched bytes.
    staleTime: Infinity,
  });
}

/**
 * Loads a non-null API artwork URL under the active account's query key.
 * @example useLearningMediaQuery(lessonCoverUrl).data; // Image URI once loaded
 */
export function useLearningMediaQuery(imageUrl: string) {
  const { id } = useAuthenticatedUser();
  return useQuery(learningMediaQueryOptions(id, imageUrl));
}
