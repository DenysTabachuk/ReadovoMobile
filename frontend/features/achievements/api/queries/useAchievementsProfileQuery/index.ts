import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { getAchievementsProfile } from '../../requests';

export function achievementsProfileQueryOptions(userId: string | undefined) {
  return {
    enabled: Boolean(userId),
    queryFn: () => getAchievementsProfile(),
    queryKey: ['achievements-profile', userId],
  };
}

export function useAchievementsProfileQuery() {
  const { currentUser } = useAuth();
  return useQuery(achievementsProfileQueryOptions(currentUser?.id));
}
