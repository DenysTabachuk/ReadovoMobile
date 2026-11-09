import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LessonSummary } from '../../components/lessonSummary';
import { DEMO_LESSONS } from '../../fixtures/lessons';
import { createStyles } from './styles';

const PREVIEW_STAGE_ROUTES = {
  'learn-first': '/(tabs)/(learning)/vocabulary/words/[lessonId]',
  'practise-first': '/(tabs)/(learning)/vocabulary/practice/[lessonId]',
  'listen-first': '/(tabs)/(learning)/vocabulary/listening/[lessonId]',
  'learn-second': undefined,
  'practise-all': undefined,
} as const;

export default function VocabularyLessonScreen() {
  const { lessonId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const lesson = DEMO_LESSONS.find(
    (candidate) => typeof lessonId === 'string' && candidate.id === lessonId,
  );

  if (!lesson) {
    return (
      <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
        <ThemedText type="screenTitle">{t('vocabulary.notFound')}</ThemedText>
        <Button onPress={() => router.replace('/(tabs)/(learning)/vocabulary')}>
          {t('vocabulary.backToLessons')}
        </Button>
      </ScrollableScreen>
    );
  }

  return (
    <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
      <LessonSummary lesson={lesson} />
      <View style={styles.progressPanel}>
        <View style={styles.progressHeading}>
          <ThemedText type="bodyStrong">
            {t('vocabulary.lessonProgress')}
          </ThemedText>
          <ThemedText style={styles.secondary}>
            {t('vocabulary.notStarted')}
          </ThemedText>
        </View>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityLabel={t('vocabulary.lessonProgress')}
          accessibilityValue={{ min: 0, max: 100, now: 0 }}
        />
      </View>
      <View style={styles.stages}>
        {lesson.stages.map((stage, index) => {
          const pathname = PREVIEW_STAGE_ROUTES[stage.id];
          const isAvailable = pathname !== undefined;
          return (
            <Pressable
              key={stage.id}
              accessibilityRole="button"
              accessibilityLabel={t(stage.titleKey, { count: stage.wordCount })}
              disabled={!isAvailable}
              accessibilityState={{ disabled: !isAvailable }}
              onPress={() => {
                if (!pathname) return;
                router.push({
                  pathname,
                  params: { lessonId: lesson.id },
                });
              }}
              style={[styles.stage, index === 0 && styles.firstStage]}
            >
              <View
                style={[
                  styles.stageNumber,
                  index === 0 && styles.firstStageNumber,
                ]}
              >
                <ThemedText type="sectionTitle" style={styles.numberText}>
                  {index + 1}
                </ThemedText>
              </View>
              <MaterialIcons
                name={stage.icon}
                size={26}
                color={colors.interactive}
                accessible={false}
              />
              <View style={styles.stageText}>
                <ThemedText type="bodyStrong">
                  {t(stage.titleKey, { count: stage.wordCount })}
                </ThemedText>
                <ThemedText style={styles.secondary}>
                  {t(stage.descriptionKey, { count: stage.wordCount })}
                </ThemedText>
                {isAvailable && (
                  <ThemedText style={styles.upcoming}>
                    {t('vocabulary.cards.previewAvailable')}
                  </ThemedText>
                )}
              </View>
              {!isAvailable && (
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color={colors.textSecondary}
                  accessibilityLabel={t('vocabulary.lockedStage')}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.footer}>
        <Button
          onPress={() =>
            router.push({
              pathname: '/(tabs)/(learning)/vocabulary/words/[lessonId]',
              params: { lessonId: lesson.id },
            })
          }
        >
          {t('vocabulary.startLesson')}
        </Button>
        <ThemedText style={styles.footerHint}>
          {t('vocabulary.cards.previewHint')}
        </ThemedText>
      </View>
    </ScrollableScreen>
  );
}
