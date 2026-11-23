import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import WardrobeScreen from '@/features/wardrobe/screens/WardrobeScreen';

export default function WardrobeRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const profileLabel = t('tabs.profile');

  return (
    <>
      <Stack.Screen
        options={{
          title: t('mascot.title'),
          headerTitle: '',
          headerBackVisible: false,
          headerLeft: ({ canGoBack, tintColor }) => (
            <HeaderBackButton
              accessibilityLabel={profileLabel}
              displayMode="default"
              label={profileLabel}
              tintColor={tintColor}
              onPress={() => {
                if (canGoBack) {
                  router.back();
                  return;
                }
                router.replace('/(tabs)/profile');
              }}
            />
          ),
        }}
      />
      <WardrobeScreen />
    </>
  );
}
