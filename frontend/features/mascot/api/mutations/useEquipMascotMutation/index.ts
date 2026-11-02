import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { equipMascotItem } from '../../requests';

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useEquipMascotMutation();
 * change.mutate('pirate-hat'); // Refreshes account data after completion.
 */
export function useEquipMascotMutation() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => equipMascotItem(itemId),
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
