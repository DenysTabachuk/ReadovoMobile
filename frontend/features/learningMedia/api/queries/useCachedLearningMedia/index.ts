import { useQueries } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/features/auth';
import { learningMediaQueryOptions } from '../useLearningMediaQuery';

/** Reads cached artwork and observes pending updates without starting a request. */
export function useCachedLearningMedia(imageUrl: string | null) {
  const { id } = useAuthenticatedUser();
  const urls = imageUrl === null ? [] : [imageUrl];
  const [artwork] = useQueries({
    queries: urls.map((url) => ({
      ...learningMediaQueryOptions(id, url),
      enabled: false,
    })),
  });
  return artwork?.data;
}
