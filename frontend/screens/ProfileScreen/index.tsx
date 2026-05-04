import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

type ProfileStats = {
  lessonsCompleted: number;
  testsCompleted: number;
  streakDays: number;
  balance: number;
};

type AchievementDefinition = {
  id: string;
  badge: number;
  coinsReward: number;
  isUnlocked: (stats: ProfileStats) => boolean;
};

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first_test_completed',
    badge: require('@/assets/images/first-test-completed-badge.png'),
    coinsReward: 50,
    isUnlocked: (stats) => stats.testsCompleted >= 1,
  },
];

const defaultStats: ProfileStats = {
  lessonsCompleted: 0,
  testsCompleted: 0,
  streakDays: 0,
  balance: 0,
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const shouldUseTwoRows = width < 390;
  const unlockedAchievements = achievementDefinitions.filter((achievement) =>
    achievement.isUnlocked(defaultStats),
  );
  const fallbackName = currentUser?.email?.split('@')[0] ?? t('profile.defaultName');
  const displayName = currentUser?.displayName ?? fallbackName;

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="screenTitle">{t('profile.title')}</ThemedText>
        </View>

        <View style={styles.profileCard}>
          <Image
            contentFit="cover"
            source={require('@/assets/images/octopus.png')}
            style={styles.avatar}
          />
          <View style={styles.profileMeta}>
            <ThemedText type="sectionTitle">{displayName}</ThemedText>
            <ThemedText style={styles.profileSubtitle}>{t('profile.subtitle')}</ThemedText>
            <View style={styles.walletRow}>
              <View style={styles.walletItem}>
                <Image
                  contentFit="contain"
                  source={require('@/assets/images/money.png')}
                  style={styles.walletIcon}
                />
                <ThemedText style={styles.walletText}>
                  {t('profile.balance')}: {defaultStats.balance}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.statsCard, shouldUseTwoRows && styles.statsCardTwoRows]}>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{defaultStats.lessonsCompleted}</ThemedText>
              <Ionicons color="#7d4ef6" name="book-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.lessons')}</ThemedText>
            </View>
          </View>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{defaultStats.testsCompleted}</ThemedText>
              <Ionicons color="#2c9d49" name="checkmark-circle-outline" size={18} />
            </View>
            <View style={styles.statMetaRow}>
              <ThemedText style={styles.statLabel}>{t('profile.stats.tests')}</ThemedText>
            </View>
          </View>
          <View style={[styles.statItem, shouldUseTwoRows && styles.statItemTwoRows]}>
            <View style={styles.statValueRow}>
              <ThemedText style={styles.statValue}>{unlockedAchievements.length}</ThemedText>
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
          {achievementDefinitions.map((achievement) => {
            const isUnlocked = achievement.isUnlocked(defaultStats);

            return (
              <View key={achievement.id} style={styles.achievementCard}>
                <Image
                  contentFit="contain"
                  source={achievement.badge}
                  style={[styles.achievementBadge, !isUnlocked && styles.lockedAchievementBadge]}
                />
                <View style={styles.achievementMeta}>
                  <ThemedText type="bodyStrong">
                    {t(`profile.achievements.${achievement.id}.title`)}
                  </ThemedText>
                  <ThemedText style={styles.achievementDescription}>
                    {t(`profile.achievements.${achievement.id}.description`)}
                  </ThemedText>
                  <View style={styles.rewardRow}>
                    <Image
                      contentFit="contain"
                      source={require('@/assets/images/money.png')}
                      style={styles.moneyIcon}
                    />
                    <ThemedText style={styles.rewardText}>
                      {t('profile.reward', { count: achievement.coinsReward })}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={isUnlocked ? styles.unlockedText : styles.lockedText}>
                  {isUnlocked ? t('profile.unlocked') : t('profile.locked')}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
