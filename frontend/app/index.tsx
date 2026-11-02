import { Redirect } from 'expo-router';

import { usePreferences } from '@/providers/preferencesProvider';
import { StartScreen } from '@/features/onboarding';

export default function IndexScreen() {
  const { hasCompletedOnboarding } = usePreferences();

  if (hasCompletedOnboarding) {
    return <Redirect href="/login" />;
  }

  return <StartScreen />;
}
