import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { getAchievementsProfile } from '../../requests';

export function useAchievementsProfileQuery() {
  const { currentUser } = useAuth();
  return useQuery({
    enabled: Boolean(currentUser?.id),
    queryFn: () => getAchievementsProfile(),
    queryKey: ['achievements-profile', currentUser?.id],
  });
}
