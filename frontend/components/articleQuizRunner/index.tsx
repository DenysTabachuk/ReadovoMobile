import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { CheckboxIndicator } from '@/components/checkboxRow';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  correctOptionIds?: string[];
  explanation?: string;
  id: string;
  options: QuizOption[];
  prompt: string;
  type: QuizQuestionType;
};

export type QuizSubmitResult = {
  correctOptionIds?: string[];
  explanation?: string;
  feedbackText?: string;
  isCorrect: boolean;
};

export type QuizSessionResult = {
  correctAnswers: number;
  durationSeconds: number;
  percentage: number;
  totalQuestions: number;
  wrongAnswers: number;
};

type ArticleQuizRunnerProps = {
  onFinish: (result: QuizSessionResult) => void;
  onSubmitAnswer?: (
    question: QuizQuestion,
    selectedOptionIds: string[],
  ) => Promise<QuizSubmitResult> | QuizSubmitResult;
  questions: QuizQuestion[];
};

export function ArticleQuizRunner({
  onFinish,
  onSubmitAnswer,
  questions,
}: ArticleQuizRunnerProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<QuizSubmitResult | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;

  const isAnswerCorrect = useMemo(() => {
    if (!currentQuestion || !isSubmitted || !submitResult) {
      return false;
    }

    return submitResult.isCorrect;
  }, [currentQuestion, isSubmitted, submitResult]);
  const resolvedCorrectOptionIds = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return submitResult?.correctOptionIds ?? currentQuestion.correctOptionIds ?? [];
  }, [currentQuestion, submitResult?.correctOptionIds]);

  if (!currentQuestion) {
    return null;
  }

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted || isSubmitting) {
      return;
    }

    if (currentQuestion.type === 'multiple_choice') {
      setSelectedOptionIds((current) =>
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      );
      return;
    }

    setSelectedOptionIds([optionId]);
  };

  const handlePrimaryPress = async () => {
    if (!isSubmitted) {
      if (selectedOptionIds.length === 0) {
        return;
      }

      setIsSubmitting(true);

      try {
        let result: QuizSubmitResult;
        if (onSubmitAnswer) {
          result = await onSubmitAnswer(currentQuestion, selectedOptionIds);
        } else {
          const selected = [...selectedOptionIds].sort();
          const correct = [...(currentQuestion.correctOptionIds ?? [])].sort();
          const isCorrect =
            selected.length === correct.length &&
            selected.every((optionId, index) => optionId === correct[index]);

          result = {
            explanation: currentQuestion.explanation,
            isCorrect,
          };
        }

        if (result.isCorrect) {
          setCorrectAnswers((current) => current + 1);
        }

        setSubmitResult(result);
      } finally {
        setIsSubmitting(false);
      }

      setIsSubmitted(true);
      return;
    }

    if (isLastQuestion) {
      const totalQuestions = questions.length;
      const wrongAnswers = totalQuestions - correctAnswers;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

      onFinish({
        correctAnswers,
        durationSeconds,
        percentage,
        totalQuestions,
        wrongAnswers,
      });
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSelectedOptionIds([]);
    setIsSubmitted(false);
    setSubmitResult(null);
  };

  return (
    <View style={styles.content}>
      <View style={styles.body}>
        <ThemedText type="description" style={styles.progress}>
          {`${questionIndex + 1}/${questions.length}`}
        </ThemedText>
        <ThemedText type="bodyStrong">{currentQuestion.prompt}</ThemedText>
        <View style={styles.options}>
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);
            const isCorrectOption = resolvedCorrectOptionIds.includes(option.id);
            const isMultipleChoice = currentQuestion.type === 'multiple_choice';
            const shouldShowCorrectState = isSubmitted && isCorrectOption;
            const shouldShowWrongState = isSubmitted && isSelected && !isCorrectOption;

            return (
              <Pressable
                disabled={isSubmitted || isSubmitting}
                key={option.id}
                onPress={() => handleSelectOption(option.id)}
                style={({ pressed }) => [
                  styles.optionButton,
                  isSelected ? styles.selectedOption : styles.unselectedOption,
                  pressed && !isSubmitted && !isSubmitting ? styles.pressedOption : null,
                  shouldShowCorrectState ? styles.correctOption : null,
                  shouldShowWrongState ? styles.wrongOption : null,
                  isSubmitting ? styles.disabledOption : null,
                ]}>
                {isMultipleChoice ? (
                  <View style={styles.checkboxIndicator}>
                    <CheckboxIndicator
                      checked={isSelected}
                      checkedColor={
                        isSubmitted
                          ? shouldShowWrongState
                            ? '#cf222e'
                            : '#2da44e'
                          : '#fff'
                      }
                      uncheckedColor="#6f8f99"
                    />
                  </View>
                ) : null}
                <ThemedText
                  type="buttonLabel"
                  style={[
                    styles.optionText,
                    isSelected ? styles.selectedOptionText : styles.unselectedOptionText,
                    shouldShowCorrectState ? styles.correctOptionText : null,
                    shouldShowWrongState ? styles.wrongOptionText : null,
                  ]}>
                  {option.text}
                </ThemedText>
                {shouldShowCorrectState || shouldShowWrongState ? (
                  <Ionicons
                    color={shouldShowCorrectState ? '#2da44e' : '#cf222e'}
                    name={shouldShowCorrectState ? 'checkmark-circle' : 'close-circle'}
                    size={22}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {isSubmitting ? (
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="small" />
        ) : null}
        {isSubmitted ? (
          <View
            style={[
              styles.feedbackBlock,
              isAnswerCorrect
                ? isDarkTheme
                  ? styles.correctFeedbackBlockDark
                  : styles.correctFeedbackBlock
                : isDarkTheme
                ? styles.wrongFeedbackBlockDark
                : styles.wrongFeedbackBlock,
            ]}>
            <Ionicons
              color={isAnswerCorrect ? '#2da44e' : '#cf222e'}
              name={isAnswerCorrect ? 'checkmark-circle' : 'close-circle'}
              size={22}
            />
            <ThemedText
              type="bodyStrong"
              style={[
                styles.feedbackText,
                isAnswerCorrect ? styles.correctFeedbackText : styles.wrongFeedbackText,
              ]}>
              {submitResult?.feedbackText
                ? submitResult.feedbackText
                : isAnswerCorrect
                ? t('dictionary.test.correct')
                : t('article.quiz.incorrect')}
            </ThemedText>
          </View>
        ) : null}
        {(submitResult?.explanation || currentQuestion.explanation) && isSubmitted ? (
          <ThemedText type="body">
            {submitResult?.explanation ?? currentQuestion.explanation}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Button
          disabled={isSubmitting || (isSubmitted ? false : selectedOptionIds.length === 0)}
          onPress={handlePrimaryPress}>
          {isSubmitted
            ? isLastQuestion
              ? t('dictionary.test.finish')
              : t('dictionary.test.next')
            : t('dictionary.test.check', { defaultValue: 'Check answer' })}
        </Button>
      </View>
    </View>
  );
}
