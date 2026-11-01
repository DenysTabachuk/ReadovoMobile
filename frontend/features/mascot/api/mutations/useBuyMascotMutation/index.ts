import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { buyMascotItem } from '../../requests';

/**
 * Applies an authenticated mascot change and refreshes this account's profile and balance.
 * @returns Mutation controls that refresh the account data after success.
 * @example
 * const change = useBuyMascotMutation();
 * change.mutate('pirate-hat'); // Refreshes account data after completion.
 */
export function useBuyMascotMutation() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => buyMascotItem(itemId),
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
