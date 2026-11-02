import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { ProfileAchievements } from './components/profileAchievements';
import { ProfileLoadError } from './components/profileLoadError';
import { ProfileStats } from './components/profileStats';
import { ProfileStreak } from './components/profileStreak';
import { ProfileSummary } from './components/profileSummary';
import { useProfileOverview } from './hooks/useProfileOverview';
import { styles } from './styles';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const {
    user,
    progress,
    achievements,
    equippedItems,
    achievementsCount,
    currentStreak,
    hasStreak,
    isLoading,
    errorMessageKey,
    retry,
  } = useProfileOverview();
  if (isLoading) return <FullScreenLoader />;

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="screenTitle">{t('profile.title')}</ThemedText>
        </View>
        <ProfileSummary
          user={user}
          balance={progress.balance}
          equippedItems={equippedItems}
        />
        <ProfileStats
          progress={progress}
          achievementsCount={achievementsCount}
          currentStreak={currentStreak}
        />
        <View style={styles.streakSection}>
          {errorMessageKey ? (
            <ProfileLoadError messageKey={errorMessageKey} onRetry={retry} />
          ) : null}
          {hasStreak ? <ProfileStreak /> : null}
        </View>
        <ProfileAchievements achievements={achievements} />
      </ScrollView>
    </ScreenContainer>
  );
}
