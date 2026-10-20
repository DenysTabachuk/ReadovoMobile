import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buyStreakFreezeToken } from '../../../utils/buyStreakFreezeToken';

/**
 * Buys a freeze token through the existing priced service operation.
 *
 * @param userId - Request and cache owner; mutations reject when absent.
 * @returns Mutation controls. Success replaces the profile and always invalidates
 * achievements, without milestone notifications or calendar invalidation.
 * @example
 * const purchase = usePurchaseStreakFreezeTokenMutation(userId);
 * await purchase.mutateAsync();
 * // The profile reflects the purchase and achievements are invalidated.
 */
export function usePurchaseStreakFreezeTokenMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Missing user id');
      }

      return buyStreakFreezeToken(userId);
    },
    onSuccess: (streak) => {
      if (!userId) {
        return;
      }

      queryClient.setQueryData(['streak-profile', userId], streak);
      void queryClient.invalidateQueries({
        queryKey: ['achievements-profile', userId],
      });
    },
  });
}
