import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { CheckVocabularyAnswerResponse } from '@/api/generated/transport';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type PracticeResultProps = {
  answers: CheckVocabularyAnswerResponse[];
  total: number;
  correctCount: number;
  onRestart: () => void;
  onBackToLesson: () => void;
  children?: ReactNode;
};

export function PracticeResult({
  answers,
  total,
  correctCount,
  onRestart,
  onBackToLesson,
  children,
}: PracticeResultProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mistakes = answers.filter((answer) => !answer.isCorrect);

  return (
    <View style={styles.content}>
      <View style={styles.summary}>
        <Ionicons
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
                {answer.word.translationUk}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
      {children}
      <Button onPress={onRestart}>{t('vocabulary.practice.tryAgain')}</Button>
      <Button variant="secondary" onPress={onBackToLesson}>
        {t('vocabulary.cards.backToLesson')}
      </Button>
    </View>
  );
}
