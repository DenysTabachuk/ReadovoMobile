import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBanner } from '@/components/banner';
import {
  getStreakErrorMessageKey,
  useStreakProfileQuery,
  useRestoreStreakMutation,
  useApplyStreakFreezeMutation,
  usePurchaseStreakFreezeTokenMutation,
  useStreakAchievementFeedback,
} from '@/features/streak';

/**
 * Owns ProfileStreak's observers, modal state, and mutation-driven feedback.
 * Its query shares the owner's cache with the parent screen's read-only query.
 * UI effects use per-call callbacks and are discarded when ProfileStreak unmounts.
 * Data hooks retain cache updates; unmounting cannot undo a server write.
 * @returns Streak data, pending/modal state, and explicit modal and mutation actions.
 * Failed mutations keep their confirmation open; canceled requests stay silent.
 * @example
 * const streakControls = useProfileStreak();
 * streakControls.purchaseFreezeToken();
 * // Closes purchase confirmation on success while ProfileStreak remains mounted.
 */
export function useProfileStreak() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const { data: streak } = useStreakProfileQuery();
  const restoreMutation = useRestoreStreakMutation();
  const applyFreezeMutation = useApplyStreakFreezeMutation();
  const purchaseFreezeTokenMutation = usePurchaseStreakFreezeTokenMutation();
  const showUnlockedAchievements = useStreakAchievementFeedback();
  const [freezeDate, setFreezeDate] = useState<string | null>(null);
  const [isPurchaseFreezeModalOpen, setIsPurchaseFreezeModalOpen] =
    useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const showStreakError = (error: unknown) => {
    const messageKey = getStreakErrorMessageKey(error);
    if (!messageKey) return;
    showBanner({ title: t(messageKey), variant: 'error' });
  };

  const openRestoreModal = () => {
    if (
      streak?.todayStatus === 'broken' &&
      streak.brokenStreakInfo?.canRestore
    ) {
      setIsRestoreModalOpen(true);
    }
  };

  const restoreStreak = () => {
    restoreMutation.mutate(undefined, {
      onSuccess: (streak, _variables, previousStreak) => {
        showUnlockedAchievements(streak, previousStreak);
        setIsRestoreModalOpen(false);
        showBanner({ title: t('streak.restore.success'), variant: 'success' });
      },
      onError: showStreakError,
    });
  };

  const applyFreeze = () => {
    if (!freezeDate) return;
    applyFreezeMutation.mutate(freezeDate, {
      onSuccess: (streak, _variables, previousStreak) => {
        showUnlockedAchievements(streak, previousStreak);
        setFreezeDate(null);
      },
      onError: showStreakError,
    });
  };

  const purchaseFreezeToken = () => {
    purchaseFreezeTokenMutation.mutate(undefined, {
      onSuccess: () => setIsPurchaseFreezeModalOpen(false),
      onError: showStreakError,
    });
  };

  return {
    streak,
    isRestoring: restoreMutation.isPending,
    isApplyingFreeze: applyFreezeMutation.isPending,
    isBuyingFreezeToken: purchaseFreezeTokenMutation.isPending,
    freezeDate,
    selectFreezeDate: (date: string) => setFreezeDate(date),
    closeFreezeModal: () => setFreezeDate(null),
    isPurchaseFreezeModalOpen,
    openPurchaseFreezeModal: () => setIsPurchaseFreezeModalOpen(true),
    closePurchaseFreezeModal: () => setIsPurchaseFreezeModalOpen(false),
    isRestoreModalOpen,
    closeRestoreModal: () => setIsRestoreModalOpen(false),
    openRestoreModal,
    restoreStreak,
    applyFreeze,
    purchaseFreezeToken,
  };
}
