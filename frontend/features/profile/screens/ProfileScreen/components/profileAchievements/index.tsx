import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import type { AchievementStatus } from '@/features/achievements';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { AchievementCard } from './components/achievementCard';
import { styles } from './styles';

type ProfileAchievementsProps = {
  achievements: AchievementStatus[];
  isLoading: boolean;
};

export function ProfileAchievements({
  achievements,
  isLoading,
}: ProfileAchievementsProps) {
  const { t } = useTranslation();
  const isDarkTheme = useColorScheme() === 'dark';
  const shouldShowAchievements = achievements.length > 0;

  return (
    <View style={styles.achievementsBlock}>
      {isLoading ? (
        <ThemedText
          style={[
            styles.achievementsNoticeText,
            isDarkTheme ? styles.achievementsNoticeTextDark : null,
          ]}
        >
          {t('profile.loading')}
        </ThemedText>
      ) : null}
      {shouldShowAchievements ? (
        <ThemedText type="sectionTitle">
          {t('profile.achievementsTitle')}
        </ThemedText>
      ) : null}
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </View>
  );
}
