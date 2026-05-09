import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/screenContainer';
import { Mascot } from '@/components/mascot';
import { ThemedText } from '@/components/themedText';
import {
  getAchievementBadge,
  getAchievementsProfile,
} from '@/features/achievements';
import { getMascotProfile } from '@/features/mascot';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

const defaultStats = {
  balance: 0,
  lessonsCompleted: 0,
  streakDays: 0,
  testsCompleted: 0,
  wordsLearned: 0,
};

export default function ProfileScreen() {
  const { t } = useTranslation();
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

  const progress = achievementsQuery.data?.progress ?? defaultStats;
  const achievements = achievementsQuery.data?.achievements ?? [];
  const unlockedAchievementsCount = (achievementsQuery.data?.achievements ?? []).filter(
    (achievement) => achievement.isUnlocked,
  ).length;
  const fallbackName = currentUser?.email?.split('@')[0] ?? t('profile.defaultName');
  const displayName = currentUser?.displayName ?? fallbackName;

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
              {t('profile.customizeMascotHint', {
                defaultValue: 'Tap the mascot to change its look',
              })}
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
              <ThemedText style={styles.statValue}>{unlockedAchievementsCount}</ThemedText>
              <Ionicons color="#2f80ed" name="trophy-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.achievements')}</ThemedText>
            </View>
          </View>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{defaultStats.streakDays}</ThemedText>
              <Ionicons color="#f2994a" name="flame-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.streak')}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.achievementsBlock}>
          <ThemedText type="sectionTitle">{t('profile.achievementsTitle')}</ThemedText>
          {achievements.map((achievement) => {
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
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
