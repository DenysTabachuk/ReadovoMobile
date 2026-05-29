import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import WardrobeScreen from '@/features/wardrobe/screens/WardrobeScreen';

export default function WardrobeRoute() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('mascot.title') }} />
      <WardrobeScreen />
    </>
  );
}
