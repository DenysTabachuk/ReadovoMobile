import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isMockApiEnabled } from '@/api';
import { useBanner } from '@/components/banner';
import { ThemedText } from '@/components/themedText';
import {
  ActivityCalendar,
  StreakAchievementCard,
  StreakFreezeCard,
  StreakFreezeConfirmModal,
  StreakFreezePurchaseModal,
  StreakRestoreConfirmModal,
} from '@/features/streak';
import { useProfileStreak } from './hooks/useProfileStreak';
import { createStyles } from './styles';

const MOCK_ACHIEVEMENT_COINS_REWARD = 30;

export function ProfileStreak() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const shouldShowMockStreakAchievementAction = __DEV__ && isMockApiEnabled();
  const {
    streak,
    isRestoring,
    isApplyingFreeze,
    isBuyingFreezeToken,
    freezeDate,
    selectFreezeDate,
    closeFreezeModal,
    isRestoreModalOpen,
    closeRestoreModal,
    isPurchaseFreezeModalOpen,
    openPurchaseFreezeModal,
    closePurchaseFreezeModal,
    openRestoreModal,
    restoreStreak,
    applyFreeze,
    purchaseFreezeToken,
  } = useProfileStreak();
  if (!streak) return null;
  return (
    <View style={styles.streakBlock}>
      <ActivityCalendar
        isCtaLoading={isRestoring}
        onPressCta={openRestoreModal}
        onRequestFreezeDay={(day) => selectFreezeDate(day.date)}
        serverNow={streak.serverNow}
        streak={streak}
      />
      {streak.brokenStreakInfo ? (
        <StreakRestoreConfirmModal
          coinBalance={streak.coinBalance}
          isRestoring={isRestoring}
          onClose={closeRestoreModal}
          onConfirm={restoreStreak}
          open={isRestoreModalOpen}
          previousStreak={streak.brokenStreakInfo.previousStreak}
          restorePrice={streak.restorePrice}
        />
      ) : null}
      <StreakFreezeCard
        coinBalance={streak.coinBalance}
        freezeTokens={streak.freezeTokens}
        freezeTokenPrice={streak.freezeTokenPrice}
        isBuying={isBuyingFreezeToken}
        onBuyToken={openPurchaseFreezeModal}
      />
      <StreakFreezeConfirmModal
        date={freezeDate}
        freezeTokens={streak.freezeTokens}
        isApplying={isApplyingFreeze}
        onClose={closeFreezeModal}
        onConfirm={applyFreeze}
        open={Boolean(freezeDate)}
      />
      <StreakFreezePurchaseModal
        freezeTokenPrice={streak.freezeTokenPrice}
        coinBalance={streak.coinBalance}
        isBuying={isBuyingFreezeToken}
        onClose={closePurchaseFreezeModal}
        onConfirm={purchaseFreezeToken}
        open={isPurchaseFreezeModalOpen}
      />
      {shouldShowMockStreakAchievementAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            showBanner({
              achievement: {
                coinsReward: MOCK_ACHIEVEMENT_COINS_REWARD,
                icon: 'trophy',
              },
              description: t('streak.achievements.3.description'),
              title: t('streak.achievements.3.title'),
              variant: 'achievement',
            });
          }}
          style={({ pressed }) => [
            styles.streakRetryButton,
            pressed ? styles.avatarButtonPressed : null,
          ]}
        >
          <ThemedText type="bodyStrong" style={[styles.streakRetryButtonText]}>
            {t('streak.debug.previewAchievement')}
          </ThemedText>
        </Pressable>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.streakAchievementsRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {streak.claimedStreakAchievements.map((achievement) => (
          <StreakAchievementCard
            achievement={achievement}
            key={achievement.milestone}
            progressValue={streak.currentStreak}
          />
        ))}
      </ScrollView>
    </View>
  );
}
