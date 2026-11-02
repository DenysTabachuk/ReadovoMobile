import {
  useApplyStreakFreezeMutation,
  usePurchaseStreakFreezeTokenMutation,
  useRestoreStreakMutation,
  useStreakProfileQuery,
} from '../../api';

/**
 * Composes the streak profile query and mutations without screen feedback.
 * @param userId - Authenticated profile owner passed to each operation.
 * @returns The profile query and restore, freeze and purchase mutation controls.
 * @example
 * const { streakQuery, restoreMutation } = useStreak(userId);
 * restoreMutation.mutate(undefined, { onSuccess: closeModal });
 * // Data hooks update caches; the mounted screen owns modal and banner effects.
 */
export function useStreak(userId: string) {
  const streakQuery = useStreakProfileQuery(userId);
  const restoreMutation = useRestoreStreakMutation(userId);
  const applyFreezeMutation = useApplyStreakFreezeMutation(userId);
  const purchaseFreezeTokenMutation =
    usePurchaseStreakFreezeTokenMutation(userId);

  return {
    applyFreezeMutation,
    purchaseFreezeTokenMutation,
    restoreMutation,
    streakQuery,
  };
}
