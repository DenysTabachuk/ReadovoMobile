import { useQuery } from '@tanstack/react-query';

import { getStreakProfile } from '../../requests/getStreakProfile';

/**
 * Reads the authenticated owner's streak without replaying unverifiable activity events.
 *
 * @param userId - Authenticated owner of the request and cache entry.
 * @returns Profile query controls. React Query cancellation discards a stale final read.
 * @example
 * const profile = useStreakProfileQuery(userId);
 * // Fetches and caches the server profile without activity writes.
 */
export function useStreakProfileQuery(userId: string) {
  return useQuery({
    queryFn: getStreakProfile,
    queryKey: ['streak-profile', userId],
  });
}
