import { Redirect } from 'expo-router';

import { FullScreenLoader } from '@/components/fullScreenLoader';
import { usePreferences } from '@/providers/preferencesProvider';
import StartScreen from '@/screens/StartScreen';

export default function IndexScreen() {
  const { hasCompletedOnboarding, isLoadingPreferences } = usePreferences();

  if (isLoadingPreferences) {
    return <FullScreenLoader />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/login" />;
  }

  return <StartScreen />;
}
