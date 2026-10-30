import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { clearMascotSlot } from '../../requests';
import type { MascotAccessorySlot } from '../../../types';

type UseClearAllMascotSlotsMutationParams = {
  slots: MascotAccessorySlot[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @param params - Screen callbacks and equipped slots to clear.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useClearAllMascotSlotsMutation({ slots: ['head'] });
 * change.mutate(); // Refreshes account data after completion.
 */
export function useClearAllMascotSlotsMutation({
  slots,
  onSuccess,
  onError,
}: UseClearAllMascotSlotsMutationParams) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      for (const slot of slots) {
        await clearMascotSlot(slot);
      }
    },
    onError,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mascot-profile', currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUser?.id],
      });
      onSuccess?.();
    },
  });
}
