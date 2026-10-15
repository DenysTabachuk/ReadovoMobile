import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';

import { QUIZ_ANSWER_COLORS, QUIZ_STATUS_ICON_SIZE } from '../../constants';

import { styles } from './styles';

type AnswerFeedbackProps = {
  explanation?: string;
  feedbackText?: string;
  isCorrect: boolean;
  isDarkTheme: boolean;
};

export function AnswerFeedback({
  explanation,
  feedbackText,
  isCorrect,
  isDarkTheme,
}: AnswerFeedbackProps) {
  const { t } = useTranslation();

  return (
    <>
      <View
        style={[
          styles.feedbackBlock,
          isCorrect
            ? isDarkTheme
              ? styles.correctFeedbackBlockDark
              : styles.correctFeedbackBlock
            : isDarkTheme
              ? styles.wrongFeedbackBlockDark
              : styles.wrongFeedbackBlock,
        ]}
      >
        <Ionicons
          color={
            isCorrect ? QUIZ_ANSWER_COLORS.correct : QUIZ_ANSWER_COLORS.wrong
          }
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
          {feedbackText
            ? feedbackText
            : isCorrect
              ? t('dictionary.test.correct')
              : t('article.quiz.incorrect')}
        </ThemedText>
      </View>
      {explanation ? <ThemedText type="body">{explanation}</ThemedText> : null}
    </>
  );
}
