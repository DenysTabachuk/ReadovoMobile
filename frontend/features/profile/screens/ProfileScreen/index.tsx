import { ScrollView, View } from 'react-native';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { ScreenContainer } from '@/components/screenContainer';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileAchievements } from './components/profileAchievements';
import { ProfileLoadError } from './components/profileLoadError';
import { ProfileStats } from './components/profileStats';
import { ProfileStreak } from './components/profileStreak';
import { ProfileSummary } from './components/profileSummary';
import { useProfileOverview } from './hooks/useProfileOverview';
import { styles } from './styles';

export default function ProfileScreen() {
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

  return (
    <ScreenContainer style={styles.container}>
      <ProfileHeader />
      {isLoading ? (
        <FullScreenLoader />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
      )}
    </ScreenContainer>
  );
}
