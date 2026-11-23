import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { LearningLevelProvider } from '@/features/learning';

export default function LearningLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <LearningLevelProvider>
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
          name="topics/[topic]"
          options={{ title: t('learning.topics.title') }}
        />
        <Stack.Screen
          name="lessons/[slug]"
          options={{ title: t('learning.lesson.title') }}
        />
        <Stack.Screen
          name="articles"
          options={{ title: t('learning.reading.title') }}
        />
      </Stack>
    </LearningLevelProvider>
  );
}
