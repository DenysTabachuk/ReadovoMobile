import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { clearAllMascotSlots } from '../../requests/clearAllMascotSlots';

/**
 * Clears every equipped mascot slot in one request and refreshes the owner's caches.
 * @returns Mutation controls requiring no slot list; owned items remain available.
 * @example
 * const change = useClearAllMascotSlotsMutation();
 * change.mutate(); // Removes equipped accessories and refreshes account data.
 */
export function useClearAllMascotSlotsMutation() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearAllMascotSlots,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mascot-profile', currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUser?.id],
      });
    },
  });
}
