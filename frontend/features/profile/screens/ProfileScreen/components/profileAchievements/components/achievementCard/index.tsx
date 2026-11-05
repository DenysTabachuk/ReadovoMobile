import { useMemo } from 'react';
import { achievementGradients } from '@/constants/gradients';
import { useTheme } from '@/hooks/use-theme';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import {
  getAchievementBadge,
  type AchievementStatus,
} from '@/features/achievements';

import { resolveAchievementProgress } from './utils/resolveAchievementProgress';
import { createStyles } from './styles';

type AchievementCardProps = {
  achievement: AchievementStatus;
};

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          colors={achievementGradients[theme]}
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
