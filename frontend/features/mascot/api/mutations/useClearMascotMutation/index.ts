import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { clearMascotSlot } from '../../requests';
import type { MascotAccessorySlot } from '../../../types';

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useClearMascotMutation();
 * change.mutate('head'); // Refreshes account data after completion.
 */
export function useClearMascotMutation() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slot: MascotAccessorySlot) => clearMascotSlot(slot),
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
