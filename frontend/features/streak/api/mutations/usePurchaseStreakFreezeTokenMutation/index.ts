import { useAuthenticatedUser } from '@/features/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { purchaseStreakFreezeToken } from '../../requests/purchaseStreakFreezeToken';

/**
 * Buys a freeze token at the configured coin price.
 *
 * @returns Mutation controls. Success replaces the profile and always invalidates
 * achievements, without milestone notifications or calendar invalidation.
 * @example
 * const purchase = usePurchaseStreakFreezeTokenMutation();
 * await purchase.mutateAsync();
 * // The profile reflects the purchase and achievements are invalidated.
 */
export function usePurchaseStreakFreezeTokenMutation() {
  const { id: userId } = useAuthenticatedUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseStreakFreezeToken,
    onSuccess: (streak) => {
      queryClient.setQueryData(['streak-profile', userId], streak);
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', userId],
      });
    },
  });
}
