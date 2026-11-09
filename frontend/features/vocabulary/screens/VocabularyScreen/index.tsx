import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { IconSymbol } from '@/components/iconSymbol';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LessonSummary } from '../../components/lessonSummary';
import { DEMO_LESSONS } from '../../fixtures/lessons';
import { createStyles } from './styles';

export default function VocabularyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="screenTitle">
          {t('vocabulary.chooseLesson')}
        </ThemedText>
        <ThemedText type="description" style={styles.secondary}>
          {t('vocabulary.description')}
        </ThemedText>
      </View>
      {DEMO_LESSONS.map((lesson) => (
        <Pressable
          key={lesson.id}
          accessibilityRole="button"
          accessibilityLabel={t(lesson.titleKey)}
          accessibilityHint={t('vocabulary.openLesson')}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/(learning)/vocabulary/[lessonId]',
              params: { lessonId: lesson.id },
            })
          }
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <LessonSummary lesson={lesson} />
          <View style={styles.cardFooter}>
            <ThemedText type="bodyStrong" style={styles.link}>
              {t('vocabulary.viewLesson')}
            </ThemedText>
            <IconSymbol
              name="chevron.right"
              size={24}
              color={colors.interactive}
            />
          </View>
        </Pressable>
      ))}
    </ScrollableScreen>
  );
}
