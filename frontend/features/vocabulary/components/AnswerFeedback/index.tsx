import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CheckVocabularyAnswerResponse } from '@/api/generated/transport';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type AnswerFeedbackProps = {
  answer: Pick<CheckVocabularyAnswerResponse, 'isCorrect' | 'word'>;
  children?: ReactNode;
};

export function AnswerFeedback({ answer, children }: AnswerFeedbackProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.feedback,
        answer.isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
      ]}
    >
      <ThemedText type="sectionTitle">
        {t(
          answer.isCorrect
            ? 'vocabulary.practice.correct'
            : 'vocabulary.practice.incorrect',
        )}
      </ThemedText>
      <ThemedText>
        {t('vocabulary.practice.answerExplanation', {
          word: answer.word.word,
          translation: answer.word.translationUk,
        })}
      </ThemedText>
      {children}
    </View>
  );
}
