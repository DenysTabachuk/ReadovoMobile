import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { equipMascotItem } from '../../requests';
import type { MascotProfile } from '../../../types';

type UseEquipMascotMutationParams = {
  onSuccess?: (profile: MascotProfile, itemId: string) => void;
  onError?: (error: Error) => void;
};

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @param params - Screen callbacks.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useEquipMascotMutation({});
 * change.mutate('pirate-hat'); // Refreshes account data after completion.
 */
export function useEquipMascotMutation({
  onSuccess,
  onError,
}: UseEquipMascotMutationParams) {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => equipMascotItem(itemId),
    onError,
    onSuccess: (profile, itemId) => {
      void queryClient.invalidateQueries({
        queryKey: ['mascot-profile', currentUser?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', currentUser?.id],
      });
      onSuccess?.(profile, itemId);
    },
  });
}
