import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { getMascotProfile } from '../../requests';

export function mascotProfileQueryOptions(userId: string | undefined) {
  return {
    enabled: Boolean(userId),
    queryFn: () => getMascotProfile(),
    queryKey: ['mascot-profile', userId],
  };
}

export function useMascotProfileQuery() {
  const { currentUser } = useAuth();
  return useQuery(mascotProfileQueryOptions(currentUser?.id));
}
