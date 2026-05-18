import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { isMockApiEnabled } from '@/api/auth/constants';
import { ScreenContainer } from '@/components/screenContainer';
import { useBanner } from '@/components/banner';
import { Mascot } from '@/components/mascot';
import { ThemedText } from '@/components/themedText';
import {
  getAchievementBadge,
  getAchievementsProfile,
} from '@/features/achievements';
import { getMascotProfile } from '@/features/mascot';
import { ActivityCalendar } from '@/features/streak/components/activityCalendar';
import { StreakAchievementCard } from '@/features/streak/components/streakAchievementCard';
import { StreakFreezeCard } from '@/features/streak/components/streakFreezeCard';
import { StreakFreezeConfirmModal } from '@/features/streak/components/streakFreezeConfirmModal';
import { StreakFreezePurchaseModal } from '@/features/streak/components/streakFreezePurchaseModal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';
import { useStreak } from '@/features/streak';

import { styles } from './styles';

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
  const { showBanner } = useBanner();
  const router = useRouter();
  const { currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const shouldUseTwoRows = width < 390;
  const isDarkTheme = colorScheme === 'dark';

  const achievementsQuery = useQuery({
    enabled: Boolean(currentUser?.id),
    queryFn: () => getAchievementsProfile(currentUser?.id ?? ''),
    queryKey: ['achievements-profile', currentUser?.id],
  });
  const mascotQuery = useQuery({
    enabled: Boolean(currentUser?.id),
    queryFn: () => getMascotProfile(currentUser?.id ?? ''),
    queryKey: ['mascot-profile', currentUser?.id],
  });
  const {
    applyFreezeMutation,
    purchaseFreezeTokenMutation,
    restoreMutation,
    streakQuery,
  } = useStreak(currentUser?.id ?? undefined);
  const [freezeDate, setFreezeDate] = useState<string | null>(null);
  const [isPurchaseFreezeModalOpen, setIsPurchaseFreezeModalOpen] = useState(false);

  const progress = achievementsQuery.data?.progress ?? defaultStats;
  const achievements = achievementsQuery.data?.achievements ?? [];
  const isAchievementsLoading = achievementsQuery.isLoading && !achievementsQuery.data;
  const shouldShowAchievements = achievements.length > 0;
  const unlockedAchievementsCount = (achievementsQuery.data?.achievements ?? []).filter(
    (achievement) => achievement.isUnlocked,
  ).length;
  const fallbackName = currentUser?.email?.split('@')[0] ?? t('profile.defaultName');
  const displayName = currentUser?.displayName ?? fallbackName;
  const streak = streakQuery.data ?? fallbackStreak;
  const unlockedStreakAchievementsCount = streak.claimedStreakAchievements.filter(
    (achievement) => achievement.isUnlocked,
  ).length;
  const isStreakLoading = streakQuery.isLoading && !streakQuery.data;
  const isStreakError = streakQuery.isError && !streakQuery.data;
  const shouldShowMockStreakAchievementAction =
    __DEV__ && isMockApiEnabled();

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            ]}>
            <Mascot
              equippedItems={mascotQuery.data?.equippedItems}
              style={styles.avatar}
            />
          </Pressable>
          <View style={styles.profileMeta}>
            <ThemedText type="sectionTitle">{displayName}</ThemedText>
            <ThemedText style={styles.profileSubtitle}>{t('profile.subtitle')}</ThemedText>
            <ThemedText style={styles.mascotHint}>
              {t('profile.customizeMascotHint')}
            </ThemedText>
            <View style={styles.walletRow}>
              <View style={styles.walletItem}>
                <Image
                  contentFit="contain"
                  source={require('../../assets/images/money.png')}
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
          ]}>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{progress.wordsLearned}</ThemedText>
              <Ionicons color="#7d4ef6" name="library-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.words')}</ThemedText>
            </View>
          </View>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{progress.testsCompleted}</ThemedText>
              <Ionicons color="#2c9d49" name="checkmark-circle-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.tests')}</ThemedText>
            </View>
          </View>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>
                {unlockedAchievementsCount + unlockedStreakAchievementsCount}
              </ThemedText>
              <Ionicons color="#2f80ed" name="trophy-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.achievements')}</ThemedText>
            </View>
          </View>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{streak?.currentStreak ?? defaultStats.streakDays}</ThemedText>
              <Ionicons color="#f2994a" name="flame" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.streak')}</ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.streakBlock}>
          {isStreakLoading ? (
            <View style={[styles.streakNoticeCard, isDarkTheme ? styles.streakNoticeCardDark : null]}>
              <ThemedText style={[styles.streakNoticeText, isDarkTheme ? styles.streakNoticeTextDark : null]}>
                {t('profile.loading')}
              </ThemedText>
            </View>
          ) : null}
          {isStreakError ? (
            <View style={[styles.streakNoticeCard, isDarkTheme ? styles.streakNoticeCardDark : null]}>
              <ThemedText style={[styles.streakNoticeText, isDarkTheme ? styles.streakNoticeTextDark : null]}>
                {t('profile.errors.loadFailed', { defaultValue: 'Не вдалося завантажити streak.' })}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void streakQuery.refetch();
                }}
                style={({ pressed }) => [
                  styles.streakRetryButton,
                  isDarkTheme ? styles.streakRetryButtonDark : null,
                  pressed ? styles.avatarButtonPressed : null,
                ]}>
                <ThemedText
                  type="bodyStrong"
                  style={[styles.streakRetryButtonText, isDarkTheme ? styles.streakRetryButtonTextDark : null]}>
                  {t('article.retry')}
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
          {!isStreakLoading && !isStreakError ? (
            <>
              <ActivityCalendar
                onPressCta={() => {
                  if (streak.todayStatus === 'broken' && streak.brokenStreakInfo?.canRestore) {
                    void restoreMutation.mutateAsync();
                  }
                }}
                onRequestFreezeDay={(day) => {
                  setFreezeDate(day.date);
                }}
                serverNow={streak.serverNow}
                streak={streak}
                userId={currentUser?.id ?? undefined}
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

                  void applyFreezeMutation.mutateAsync(freezeDate)
                    .then(() => {
                      setFreezeDate(null);
                    })
                    .catch((error) => {
                      const messageKey =
                        error instanceof Error ? error.message : 'streak.errors.freezeFailed';

                      showBanner({
                        title: t(messageKey, {
                          defaultValue: t('streak.errors.freezeFailed'),
                        }),
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
                  void purchaseFreezeTokenMutation.mutateAsync()
                    .then(() => {
                      setIsPurchaseFreezeModalOpen(false);
                    })
                    .catch((error) => {
                      const messageKey =
                        error instanceof Error
                          ? error.message
                          : 'streak.errors.purchaseFreezeFailed';

                      showBanner({
                        title: t(messageKey, {
                          defaultValue: t('streak.errors.purchaseFreezeFailed'),
                        }),
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
                  ]}>
                  <ThemedText
                    type="bodyStrong"
                    style={[
                      styles.streakRetryButtonText,
                      isDarkTheme ? styles.streakRetryButtonTextDark : null,
                    ]}>
                    Програти streak-achievement
                  </ThemedText>
                </Pressable>
              ) : null}
            </>
          ) : null}
          <ScrollView
            contentContainerStyle={styles.streakAchievementsRow}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {streak.claimedStreakAchievements.map((achievement) => (
              <StreakAchievementCard
                achievement={achievement}
                key={achievement.milestone}
                progressValue={streak.currentStreak}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.achievementsBlock}>
          {isAchievementsLoading ? (
            <ThemedText style={[styles.achievementsNoticeText, isDarkTheme ? styles.achievementsNoticeTextDark : null]}>
              {t('profile.loading')}
            </ThemedText>
          ) : null}
          {shouldShowAchievements ? (
            <ThemedText type="sectionTitle">{t('profile.achievementsTitle')}</ThemedText>
          ) : null}
          {shouldShowAchievements ? achievements.map((achievement) => {
            const isUnlocked = achievement.isUnlocked;
            const progressValue = achievement.progressValue;
            const progressRatio = Math.min(progressValue / achievement.targetValue, 1);
            const progressPercentage: DimensionValue =
              `${Math.round(progressRatio * 100)}%`;

            return (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  isUnlocked ? styles.unlockedAchievementCard : styles.lockedAchievementCard,
                ]}>
                {isUnlocked ? (
                  <LinearGradient
                    colors={
                      isDarkTheme
                        ? ['#211339', '#3a2461', '#5b36ad']
                        : ['#f3edff', '#e4d7ff', '#c9b2ff']
                    }
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                    start={{ x: 0, y: 0 }}
                    style={styles.unlockedAchievementGradient}
                  />
                ) : null}
                <Image
                  contentFit="contain"
                  source={getAchievementBadge(achievement.badgeKey)}
                  style={[styles.achievementBadge, !isUnlocked && styles.lockedAchievementBadge]}
                />
                <View style={styles.achievementMeta}>
                  <ThemedText type="bodyStrong">
                    {t(achievement.titleKey)}
                  </ThemedText>
                  <ThemedText style={styles.achievementDescription}>
                    {t(achievement.descriptionKey)}
                  </ThemedText>
                  <ThemedText style={isUnlocked ? styles.unlockedText : styles.lockedText}>
                    {isUnlocked ? t('profile.unlocked') : t('profile.locked')}
                  </ThemedText>
                  <View style={styles.achievementProgressBlock}>
                    <View style={styles.achievementProgressTrack}>
                      <View
                        style={[
                          styles.achievementProgressFill,
                          isUnlocked
                            ? styles.unlockedAchievementProgressFill
                            : styles.lockedAchievementProgressFill,
                          { width: progressPercentage },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.achievementProgressText}>
                      {`${Math.min(progressValue, achievement.targetValue)}/${achievement.targetValue}`}
                    </ThemedText>
                  </View>
                  <View style={styles.rewardRow}>
                    <Image
                      contentFit="contain"
                      source={require('../../assets/images/money.png')}
                      style={styles.moneyIcon}
                    />
                    <ThemedText style={styles.rewardText}>
                      {t('profile.reward', { count: achievement.coinsReward })}
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          }) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
