import { Redirect } from 'expo-router';

import { FullScreenLoader } from '@/components/fullScreenLoader';
import { useAuth } from '@/features/auth';
import { usePreferences } from '@/providers/preferencesProvider';
import { StartScreen } from '@/features/onboarding';

export default function IndexScreen() {
  const { hasCompletedOnboarding, isLoadingPreferences } = usePreferences();
  const { isAuthenticated, isHydratingAuth } = useAuth();

  if (isLoadingPreferences || isHydratingAuth) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/login" />;
  }

  return <StartScreen />;
}
