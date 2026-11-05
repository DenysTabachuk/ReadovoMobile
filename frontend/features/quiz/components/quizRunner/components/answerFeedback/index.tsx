import { useTheme } from '@/hooks/use-theme';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';

import { QUIZ_STATUS_ICON_SIZE } from '../../constants';

import { createStyles } from './styles';

type AnswerFeedbackProps = {
  explanation?: string;
  feedbackText?: string;
  isCorrect: boolean;
};

export function AnswerFeedback({
  explanation,
  feedbackText,
  isCorrect,
}: AnswerFeedbackProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { t } = useTranslation();
  let resolvedFeedbackText = feedbackText;
  if (!resolvedFeedbackText) {
    resolvedFeedbackText = isCorrect
      ? t('dictionary.test.correct')
      : t('article.quiz.incorrect');
  }

  return (
    <>
      <View
        style={[
          styles.feedbackBlock,
          isCorrect ? styles.correctFeedbackBlock : styles.wrongFeedbackBlock,
        ]}
      >
        <Ionicons
          color={isCorrect ? colors.success : colors.danger}
          name={isCorrect ? 'checkmark-circle' : 'close-circle'}
          size={QUIZ_STATUS_ICON_SIZE}
        />
        <ThemedText
          type="bodyStrong"
          style={[
            styles.feedbackText,
            isCorrect ? styles.correctFeedbackText : styles.wrongFeedbackText,
          ]}
        >
          {resolvedFeedbackText}
        </ThemedText>
      </View>
      {explanation ? <ThemedText type="body">{explanation}</ThemedText> : null}
    </>
  );
}
