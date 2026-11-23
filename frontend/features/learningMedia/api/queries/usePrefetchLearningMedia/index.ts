import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getAuthSessionVersion, useAuthenticatedUser } from '@/features/auth';
import { learningMediaQueryOptions } from '../useLearningMediaQuery';

const MAX_BACKGROUND_IMAGE_REQUESTS = 3;

/**
 * Loads unique artwork in priority order, using the account's display cache.
 * @param imageUrls - Stable, unique URLs ordered by first use. An empty list skips loading.
 * @param retain - Keep the queued images in memory for the mounted activity.
 * Leaving the activity or changing accounts stops the queue from starting new work.
 * @returns A function that immediately prefetches an image requested by the user.
 * @example usePrefetchLearningMedia(practiceImageUrls, true); // Keeps artwork for the attempt.
 */
export function usePrefetchLearningMedia(
  imageUrls: readonly string[],
  retain: boolean,
) {
  const { id } = useAuthenticatedUser();
  const queryClient = useQueryClient();
  const imageOptions = useMemo(
    () => imageUrls.map((url) => learningMediaQueryOptions(id, url)),
    [id, imageUrls],
  );
  const retainedOptions = useMemo(
    () =>
      retain
        ? imageOptions.map((options) => ({
            ...options,
            enabled: false,
            notifyOnChangeProps: [],
          }))
        : [],
    [imageOptions, retain],
  );
  // These observers prevent garbage collection without starting their own requests.
  useQueries({ queries: retainedOptions });

  useEffect(() => {
    const sessionVersion = getAuthSessionVersion();
    const queue = imageOptions.values();
    let stopped = false;

    const prefetchNext = async () => {
      while (!stopped && getAuthSessionVersion() === sessionVersion) {
        const { value, done } = queue.next();
        if (done) return;
        await queryClient.prefetchQuery(value);
      }
    };
    const workerCount = Math.min(
      imageOptions.length,
      MAX_BACKGROUND_IMAGE_REQUESTS,
    );
    for (let index = 0; index < workerCount; index += 1) {
      void prefetchNext();
    }
    return () => {
      stopped = true;
    };
  }, [imageOptions, queryClient]);

  return (imageUrl: string) =>
    queryClient.prefetchQuery(learningMediaQueryOptions(id, imageUrl));
}
