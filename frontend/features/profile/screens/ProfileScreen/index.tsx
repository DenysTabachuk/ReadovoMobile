import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';
import {
  getStreakErrorMessageKey,
  useStreak,
  ActivityCalendar,
  StreakAchievementCard,
  StreakFreezeCard,
  StreakFreezeConfirmModal,
  StreakFreezePurchaseModal,
  StreakRestoreConfirmModal,
} from '@/features/streak';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { isMockApiEnabled } from '@/api';
import { ScreenContainer } from '@/components/screenContainer';
import { useBanner } from '@/components/banner';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ThemedText } from '@/components/themedText';
import { useAchievementsProfileQuery } from '@/features/achievements';
import { useMascotProfileQuery, Mascot } from '@/features/mascot';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/features/auth';

import { styles } from './styles';
import { ProfileAchievements } from './components/profileAchievements';

const defaultStats = {
  balance: 0,
  lessonsCompleted: 0,
  streakDays: 0,
  testsCompleted: 0,
  wordsLearned: 0,
};

const fallbackStreak = {
  activityHistory: [],
  brokenStreakInfo: null,
  claimedStreakAchievements: [],
  coinBalance: 0,
  currentStreak: 0,
  freezeTokens: 0,
  lastActivityDate: null,
  longestStreak: 0,
  nextBonusInDays: 3,
  nextMilestone: 3 as const,
  serverNow: new Date().toISOString(),
  todayStatus: 'pending' as const,
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showBanner } = useBanner();
  const router = useRouter();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const shouldUseTwoRows = width < 390;
  const isDarkTheme = colorScheme === 'dark';

  const achievementsQuery = useAchievementsProfileQuery();
  const mascotQuery = useMascotProfileQuery();
  const {
    applyFreezeMutation,
    purchaseFreezeTokenMutation,
    restoreMutation,
    streakQuery,
  } = useStreak(currentUser?.id ?? undefined);
  const [freezeDate, setFreezeDate] = useState<string | null>(null);
  const [isPurchaseFreezeModalOpen, setIsPurchaseFreezeModalOpen] =
    useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const progress = achievementsQuery.data?.progress ?? defaultStats;
  const achievements = achievementsQuery.data?.achievements ?? [];
  const isAchievementsLoading =
    achievementsQuery.isLoading && !achievementsQuery.data;
  const unlockedAchievementsCount = (
    achievementsQuery.data?.achievements ?? []
  ).filter((achievement) => achievement.isUnlocked).length;
  const fallbackName =
    currentUser?.email?.split('@')[0] ?? t('profile.defaultName');
  const displayName = currentUser?.displayName ?? fallbackName;
  const streak = streakQuery.data ?? fallbackStreak;
  const unlockedStreakAchievementsCount =
    streak.claimedStreakAchievements.filter(
      (achievement) => achievement.isUnlocked,
    ).length;
  const isStreakLoading = streakQuery.isLoading && !streakQuery.data;
  const isStreakError = streakQuery.isError && !streakQuery.data;
  const profileLoadError =
    (!achievementsQuery.data && achievementsQuery.error) ||
    (!mascotQuery.data && mascotQuery.error) ||
    (!streakQuery.data && streakQuery.error);
  const profileLoadErrorMessageKey = profileLoadError
    ? getApiErrorMessageKey(profileLoadError)
    : null;
  const isInitialProfileLoading =
    Boolean(currentUser?.id) &&
    ((achievementsQuery.isLoading && !achievementsQuery.data) ||
      (mascotQuery.isLoading && !mascotQuery.data) ||
      isStreakLoading);
  const shouldShowMockStreakAchievementAction = __DEV__ && isMockApiEnabled();

  if (isInitialProfileLoading) {
    return <FullScreenLoader />;
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="screenTitle">{t('profile.title')}</ThemedText>
        </View>

        <View style={styles.profileCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.customizeMascotHint', {
              defaultValue: 'Customize mascot',
            })}
            onPress={() => router.push('/wardrobe')}
            style={({ pressed }) => [
              styles.avatarButton,
              pressed ? styles.avatarButtonPressed : null,
            ]}
          >
            <Mascot
              equippedItems={mascotQuery.data?.equippedItems}
              style={styles.avatar}
            />
          </Pressable>
          <View style={styles.profileMeta}>
            <ThemedText type="sectionTitle">{displayName}</ThemedText>
            <ThemedText style={styles.profileSubtitle}>
              {t('profile.subtitle')}
            </ThemedText>
            <ThemedText style={styles.mascotHint}>
              {t('profile.customizeMascotHint')}
            </ThemedText>
            <View style={styles.walletRow}>
              <View style={styles.walletItem}>
                <Image
                  contentFit="contain"
                  source={require('../../../../assets/images/money.png')}
                  style={styles.walletIcon}
                />
                <ThemedText style={styles.walletText}>
                  {t('profile.balance')}: {progress.balance}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.statsCard,
            isDarkTheme ? styles.statsCardDark : null,
            shouldUseTwoRows && styles.statsCardTwoRows,
          ]}
        >
          <View
            style={[
              styles.statItem,
              shouldUseTwoRows && styles.statItemTwoRows,
            ]}
          >
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>
                {progress.wordsLearned}
              </ThemedText>
              <Ionicons color="#7d4ef6" name="library-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>
                {t('profile.stats.words')}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statItem,
              shouldUseTwoRows && styles.statItemTwoRows,
            ]}
          >
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>
                {progress.testsCompleted}
              </ThemedText>
              <Ionicons
                color="#2c9d49"
                name="checkmark-circle-outline"
                size={18}
              />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>
                {t('profile.stats.tests')}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statItem,
              shouldUseTwoRows && styles.statItemTwoRows,
            ]}
          >
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>
                {unlockedAchievementsCount + unlockedStreakAchievementsCount}
              </ThemedText>
              <Ionicons color="#2f80ed" name="trophy-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>
                {t('profile.stats.achievements')}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statItem,
              shouldUseTwoRows && styles.statItemTwoRows,
            ]}
          >
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>
                {streak?.currentStreak ?? defaultStats.streakDays}
              </ThemedText>
              <Ionicons color="#f2994a" name="flame" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>
                {t('profile.stats.streak')}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.streakBlock}>
          {isStreakLoading ? (
            <View
              style={[
                styles.streakNoticeCard,
                isDarkTheme ? styles.streakNoticeCardDark : null,
              ]}
            >
              <ThemedText
                style={[
                  styles.streakNoticeText,
                  isDarkTheme ? styles.streakNoticeTextDark : null,
                ]}
              >
                {t('profile.loading')}
              </ThemedText>
            </View>
          ) : null}
          {profileLoadErrorMessageKey ? (
            <View
              style={[
                styles.streakNoticeCard,
                isDarkTheme ? styles.streakNoticeCardDark : null,
              ]}
            >
              <ThemedText
                style={[
                  styles.streakNoticeText,
                  isDarkTheme ? styles.streakNoticeTextDark : null,
                ]}
              >
                {t(profileLoadErrorMessageKey)}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void streakQuery.refetch();
                  void achievementsQuery.refetch();
                  void mascotQuery.refetch();
                }}
                style={({ pressed }) => [
                  styles.streakRetryButton,
                  isDarkTheme ? styles.streakRetryButtonDark : null,
                  pressed ? styles.avatarButtonPressed : null,
                ]}
              >
                <ThemedText
                  type="bodyStrong"
                  style={[
                    styles.streakRetryButtonText,
                    isDarkTheme ? styles.streakRetryButtonTextDark : null,
                  ]}
                >
                  {t('article.retry')}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
          {!isStreakLoading && !isStreakError ? (
            <>
              <ActivityCalendar
                isCtaLoading={restoreMutation.isPending}
                onPressCta={() => {
                  if (
                    streak.todayStatus === 'broken' &&
                    streak.brokenStreakInfo?.canRestore
                  ) {
                    setIsRestoreModalOpen(true);
                  }
                }}
                onRequestFreezeDay={(day) => {
                  setFreezeDate(day.date);
                }}
                serverNow={streak.serverNow}
                streak={streak}
              />
              <StreakRestoreConfirmModal
                coinBalance={streak.coinBalance}
                isRestoring={restoreMutation.isPending}
                onClose={() => {
                  setIsRestoreModalOpen(false);
                }}
                onConfirm={() => {
                  void restoreMutation
                    .mutateAsync()
                    .then(() => {
                      setIsRestoreModalOpen(false);
                      if (currentUser?.id) {
                        void queryClient.invalidateQueries({
                          queryKey: ['streak-calendar-month', currentUser.id],
                        });
                      }
                      showBanner({
                        title: t('streak.restore.success'),
                        variant: 'success',
                      });
                    })
                    .catch((error) => {
                      const messageKey = getStreakErrorMessageKey(error);
                      if (!messageKey) return;

                      showBanner({
                        title: t(messageKey),
                        variant: 'error',
                      });
                    });
                }}
                open={isRestoreModalOpen}
                previousStreak={streak.brokenStreakInfo?.previousStreak ?? 0}
                restorePrice={streak.brokenStreakInfo?.restorePrice ?? 100}
              />
              <StreakFreezeCard
                coinBalance={streak.coinBalance}
                freezeTokens={streak.freezeTokens}
                isBuying={purchaseFreezeTokenMutation.isPending}
                onBuyToken={() => {
                  setIsPurchaseFreezeModalOpen(true);
                }}
              />
              <StreakFreezeConfirmModal
                date={freezeDate}
                freezeTokens={streak.freezeTokens}
                isApplying={applyFreezeMutation.isPending}
                onClose={() => {
                  setFreezeDate(null);
                }}
                onConfirm={() => {
                  if (!freezeDate) {
                    return;
                  }

                  void applyFreezeMutation
                    .mutateAsync(freezeDate)
                    .then(() => {
                      setFreezeDate(null);
                    })
                    .catch((error) => {
                      const messageKey = getStreakErrorMessageKey(error);
                      if (!messageKey) return;

                      showBanner({
                        title: t(messageKey),
                        variant: 'error',
                      });
                    });
                }}
                open={Boolean(freezeDate)}
              />
              <StreakFreezePurchaseModal
                coinBalance={streak.coinBalance}
                isBuying={purchaseFreezeTokenMutation.isPending}
                onClose={() => {
                  setIsPurchaseFreezeModalOpen(false);
                }}
                onConfirm={() => {
                  void purchaseFreezeTokenMutation
                    .mutateAsync()
                    .then(() => {
                      setIsPurchaseFreezeModalOpen(false);
                    })
                    .catch((error) => {
                      const messageKey = getStreakErrorMessageKey(error);
                      if (!messageKey) return;

                      showBanner({
                        title: t(messageKey),
                        variant: 'error',
                      });
                    });
                }}
                open={isPurchaseFreezeModalOpen}
              />
              {shouldShowMockStreakAchievementAction ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    showBanner({
                      achievement: {
                        coinsReward: 30,
                        icon: 'trophy',
                      },
                      description: t('streak.achievements.3.description'),
                      title: t('streak.achievements.3.title'),
                      variant: 'achievement',
                    });
                  }}
                  style={({ pressed }) => [
                    styles.streakRetryButton,
                    isDarkTheme ? styles.streakRetryButtonDark : null,
                    pressed ? styles.avatarButtonPressed : null,
                  ]}
                >
                  <ThemedText
                    type="bodyStrong"
                    style={[
                      styles.streakRetryButtonText,
                      isDarkTheme ? styles.streakRetryButtonTextDark : null,
                    ]}
                  >
                    Програти streak-achievement
                  </ThemedText>
                </Pressable>
              ) : null}
            </>
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

        <ProfileAchievements
          achievements={achievements}
          isLoading={isAchievementsLoading}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
