import { useQuery } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';
import { getLearningMedia } from '../../requests/getLearningMedia';

// Limit how long unused Base64 artwork occupies the in-memory query cache.
const IMAGE_GC_TIME_MS = 60 * 1000;

/**
 * Loads a non-null API artwork URL under the active account's query key.
 * @example useLearningMediaQuery(lessonCoverUrl).data; // Image URI once loaded
 */
export function useLearningMediaQuery(imageUrl: string) {
  const { id } = useAuthenticatedUser();
  return useQuery({
    queryKey: ['learning', id, 'media', imageUrl],
    queryFn: ({ signal }) => getLearningMedia(imageUrl, signal),
    retry: false,
    gcTime: IMAGE_GC_TIME_MS,
  });
}
