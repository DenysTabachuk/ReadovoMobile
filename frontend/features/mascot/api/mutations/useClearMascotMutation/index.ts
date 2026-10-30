import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { clearMascotSlot } from '../../requests';
import type { MascotAccessorySlot, MascotProfile } from '../../../types';

type UseClearMascotMutationParams = {
  onSuccess?: (profile: MascotProfile, slot: MascotAccessorySlot) => void;
  onError?: (error: Error) => void;
};

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @param params - Screen callbacks.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useClearMascotMutation({});
 * change.mutate('head'); // Refreshes account data after completion.
 */
export function useClearMascotMutation({
  onSuccess,
  onError,
}: UseClearMascotMutationParams) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slot: MascotAccessorySlot) => clearMascotSlot(slot),
    onError,
    onSuccess: (profile, slot) => {
      void queryClient.invalidateQueries({
        queryKey: ['mascot-profile', currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUser?.id],
      });
      onSuccess?.(profile, slot);
    },
  });
}
