import { useQuery } from '@tanstack/react-query';

import { getAuthSessionSnapshot } from '@/features/auth';
import { syncPendingStreakEvents } from '../../../utils/syncPendingStreakEvents';
import { getStreakProfile } from '../../requests/getStreakProfile';

/**
 * Synchronizes pending activity events before each profile fetch.
 *
 * @param userId - Cache/request owner; automatic fetching is disabled without it.
 * @returns Profile query controls. Sync/storage errors prevent the profile fetch.
 * React Query cancellation discards the final read; replay guards its own writes.
 * @example
 * const profile = useStreakProfileQuery(userId);
 * // Each fetch attempts pending events first, then caches the server profile.
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
      await syncPendingStreakEvents(userId);
      session.assertCurrent();
      return getStreakProfile();
    },
    queryKey: ['streak-profile', userId],
  });
}
