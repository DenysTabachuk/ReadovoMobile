import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

export default function LearningLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="vocabulary/index"
        options={{ title: t('learning.vocabulary.title') }}
      />
      <Stack.Screen
        name="vocabulary/[lessonId]"
        options={{ title: t('vocabulary.lessonOverview') }}
      />
      <Stack.Screen
        name="vocabulary/words/[lessonId]"
        options={{ title: t('vocabulary.cards.title') }}
      />
      <Stack.Screen
        name="articles"
        options={{ title: t('learning.reading.title') }}
      />
    </Stack>
  );
}
