import { useAuthenticatedUser } from '@/features/auth';
import { useQuery } from '@tanstack/react-query';

import { getStreakProfile } from '../../requests/getStreakProfile';

/**
 * Reads the authenticated owner's streak without replaying unverifiable activity events.
 * The owner comes from the protected auth context and remains part of the cache key.
 *
 * @returns Profile query controls. React Query cancellation discards a stale final read.
 * @example
 * const profile = useStreakProfileQuery();
 * // Fetches and caches the server profile without activity writes.
 */
export function useStreakProfileQuery() {
  const { id: userId } = useAuthenticatedUser();
  return useQuery({
    queryFn: getStreakProfile,
    queryKey: ['streak-profile', userId],
  });
}
