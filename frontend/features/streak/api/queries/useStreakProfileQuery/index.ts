import { useQuery } from '@tanstack/react-query';

import { getAuthSessionSnapshot } from '@/features/auth';
import { getStreakProfile } from '../../requests/getStreakProfile';

/**
 * Reads the authenticated owner's streak without replaying unverifiable activity events.
 *
 * @param userId - Cache/request owner; automatic fetching is disabled without it.
 * @returns Profile query controls. React Query cancellation discards a stale final read.
 * @example
 * const profile = useStreakProfileQuery(userId);
 * // Fetches and caches the server profile without activity writes.
 */
export function useStreakProfileQuery(userId?: string) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      const session = await getAuthSessionSnapshot(userId);
      session.assertCurrent();
      return getStreakProfile();
    },
    queryKey: ['streak-profile', userId],
  });
}
