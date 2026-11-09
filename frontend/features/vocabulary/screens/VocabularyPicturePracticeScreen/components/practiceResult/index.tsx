import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { COMMON_THINGS_LESSON_ID } from '../../../../fixtures/lessons';
import type { PicturePracticeAnswer } from '../../../../hooks/usePicturePractice';
import { createStyles } from './styles';

type PracticeResultProps = {
  answers: PicturePracticeAnswer[];
  total: number;
  correctCount: number;
  onRestart: () => void;
};

export function PracticeResult({
  answers,
  total,
  correctCount,
  onRestart,
}: PracticeResultProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mistakes = answers.filter((answer) => !answer.isCorrect);

  return (
    <View style={styles.content}>
      <View style={styles.summary}>
        <MaterialIcons
          name="flag"
          size={48}
          color={colors.interactive}
          accessible={false}
        />
        <ThemedText type="screenTitle">
          {t('vocabulary.practice.resultTitle')}
        </ThemedText>
        <ThemedText type="heroTitle">
          {t('vocabulary.practice.score', { correct: correctCount, total })}
        </ThemedText>
        <ThemedText style={styles.secondary}>
          {t('vocabulary.practice.correctAnswers')}
        </ThemedText>
        <ThemedText style={styles.secondary}>
          {t('vocabulary.practice.localResult')}
        </ThemedText>
      </View>
      {mistakes.length > 0 && (
        <View style={styles.review}>
          <ThemedText type="sectionTitle">
            {t('vocabulary.practice.reviewWords')}
          </ThemedText>
          {mistakes.map((answer) => (
            <View key={answer.questionId} style={styles.word}>
              <ThemedText type="bodyStrong">{answer.word.word}</ThemedText>
              <ThemedText style={styles.secondary}>
                {t(answer.word.translationKey)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
      <Button onPress={onRestart}>{t('vocabulary.practice.tryAgain')}</Button>
      <Button
        variant="secondary"
        onPress={() =>
          router.dismissTo({
            pathname: '/(tabs)/(learning)/vocabulary/[lessonId]',
            params: { lessonId: COMMON_THINGS_LESSON_ID },
          })
        }
      >
        {t('vocabulary.cards.backToLesson')}
      </Button>
    </View>
  );
}
