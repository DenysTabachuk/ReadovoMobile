import { Redirect } from 'expo-router';

import NotificationTestScreen from '@/features/learningReminders/screens/NotificationTestScreen';

export default function NotificationTestRoute() {
  if (!__DEV__) return <Redirect href="/(tabs)/settings" />;

  return <NotificationTestScreen />;
}
