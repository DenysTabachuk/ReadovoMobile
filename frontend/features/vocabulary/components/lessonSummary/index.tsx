import { Image } from 'expo-image';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { VocabularyLesson } from '../../fixtures/lessons';
import { createStyles } from './styles';

type LessonSummaryProps = {
  lesson: VocabularyLesson;
};

export function LessonSummary({ lesson }: LessonSummaryProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.summary}>
      <View style={styles.heading}>
        <Image
          source={lesson.image}
          style={styles.image}
          contentFit="contain"
          accessible={false}
        />
        <View style={styles.headingText}>
          <ThemedText type="screenTitle">{t(lesson.titleKey)}</ThemedText>
          <View style={styles.metadata}>
            <View style={styles.level}>
              <ThemedText type="bodyStrong" style={styles.levelText}>
                {lesson.level}
              </ThemedText>
            </View>
            <ThemedText style={styles.secondary}>
              {t('vocabulary.wordCount', { count: lesson.wordCount })}
            </ThemedText>
          </View>
        </View>
      </View>
      <ThemedText style={styles.secondary}>
        {t(lesson.descriptionKey)}
      </ThemedText>
    </View>
  );
}
