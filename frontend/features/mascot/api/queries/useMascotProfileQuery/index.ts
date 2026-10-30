import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';
import { getMascotProfile } from '../../requests';

export function useMascotProfileQuery() {
  const { currentUser } = useAuth();
  return useQuery({
    enabled: Boolean(currentUser?.id),
    queryFn: () => getMascotProfile(),
    queryKey: ['mascot-profile', currentUser?.id],
  });
}
