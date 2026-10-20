import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import {
  getAchievementBadge,
  type AchievementStatus,
} from '@/features/achievements';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { resolveAchievementProgress } from './utils/resolveAchievementProgress';
import { styles } from './styles';

type AchievementCardProps = {
  achievement: AchievementStatus;
};

const UNLOCKED_GRADIENT_COLORS = {
  dark: ['#211339', '#3a2461', '#5b36ad'],
  light: ['#f3edff', '#e4d7ff', '#c9b2ff'],
} as const;

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { t } = useTranslation();
  const isDarkTheme = useColorScheme() === 'dark';
  const { isUnlocked } = achievement;
  const progress = resolveAchievementProgress(achievement);

  return (
    <View
      style={[
        styles.achievementCard,
        isUnlocked
          ? styles.unlockedAchievementCard
          : styles.lockedAchievementCard,
      ]}
    >
      {isUnlocked ? (
        <LinearGradient
          colors={UNLOCKED_GRADIENT_COLORS[isDarkTheme ? 'dark' : 'light']}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          style={styles.unlockedAchievementGradient}
        />
      ) : null}
      <Image
        contentFit="contain"
        source={getAchievementBadge(achievement.badgeKey)}
        style={[
          styles.achievementBadge,
          !isUnlocked && styles.lockedAchievementBadge,
        ]}
      />
      <View style={styles.achievementMeta}>
        <ThemedText type="bodyStrong">{t(achievement.titleKey)}</ThemedText>
        <ThemedText style={styles.achievementDescription}>
          {t(achievement.descriptionKey)}
        </ThemedText>
        <ThemedText
          style={isUnlocked ? styles.unlockedText : styles.lockedText}
        >
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
                { width: progress.percentage },
              ]}
            />
          </View>
          <ThemedText style={styles.achievementProgressText}>
            {progress.text}
          </ThemedText>
        </View>
        <View style={styles.rewardRow}>
          <Image
            contentFit="contain"
            source={require('../../../../../../../../assets/images/money.png')}
            style={styles.moneyIcon}
          />
          <ThemedText style={styles.rewardText}>
            {t('profile.reward', {
              count: achievement.coinsReward,
            })}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
