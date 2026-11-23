import { useTheme } from '@/hooks/use-theme';
import { type ReactNode, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ThemedText } from '@/components/themedText';

import {
  type QuizQuestion,
  type QuizSessionResult,
  type QuizSubmitResult,
} from '../../types';
import { useQuizAttempt } from '../../hooks/useQuizAttempt';

import { AnswerFeedback } from './components/answerFeedback';
import { QuestionOptions } from './components/questionOptions';
import { QuizRunnerFooter } from './components/quizRunnerFooter';
import { styles } from './styles';
import { createQuizSessionResult } from './utils/createQuizSessionResult';
import { isAnswerSelectionCorrect } from './utils/isAnswerSelectionCorrect';

type QuizAnswerCallbacks = {
  onSuccess: (result: QuizSubmitResult) => void;
  onError: (error: unknown) => void;
  onSettled: () => void;
};

type QuizRunnerProps = {
  isFinishing?: boolean;
  onSubmitError?: (error: unknown) => void;
  onFinish: (result: QuizSessionResult) => void;
  renderSubmittedQuestionAction?: (
    question: QuizQuestion,
    result: QuizSubmitResult,
  ) => ReactNode;
  onSubmitAnswer?: (
    question: QuizQuestion,
    selectedOptionIds: string[],
    // The caller passes these to mutate, binding feedback to its screen observer.
    callbacks: QuizAnswerCallbacks,
  ) => void;
  questions: QuizQuestion[];
};

export function QuizRunner({
  isFinishing = false,
  onFinish,
  renderSubmittedQuestionAction,
  onSubmitAnswer,
  onSubmitError,
  questions,
}: QuizRunnerProps) {
  const { colors } = useTheme();
  const {
    questionIndex,
    selectedOptionIds,
    answer: submitResult,
    correctCount,
    isSubmitting,
    selectOption,
    submitAnswer,
    advance,
  } = useQuizAttempt<QuizSubmitResult>();
  const [startedAt] = useState(() => Date.now());
  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isSubmitted = submitResult !== null;

  const resolvedCorrectOptionIds = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return (
      submitResult?.correctOptionIds ?? currentQuestion.correctOptionIds ?? []
    );
  }, [currentQuestion, submitResult?.correctOptionIds]);

  if (!currentQuestion) {
    return null;
  }

  const reportSubmitError = (error: unknown) => {
    if (!onSubmitError) throw error;
    onSubmitError(error);
  };

  const handlePrimaryPress = () => {
    if (!isSubmitted) {
      try {
        submitAnswer((selection, callbacks) => {
          if (onSubmitAnswer) {
            onSubmitAnswer(currentQuestion, selection, {
              ...callbacks,
              onError: reportSubmitError,
            });
            return;
          }
          callbacks.onSuccess({
            explanation: currentQuestion.explanation,
            isCorrect: isAnswerSelectionCorrect(
              selection,
              currentQuestion.correctOptionIds ?? [],
            ),
          });
          callbacks.onSettled();
        });
      } catch (error) {
        reportSubmitError(error);
      }
      return;
    }

    if (isLastQuestion) {
      onFinish(
        createQuizSessionResult({
          correctAnswers: correctCount,
          finishedAt: Date.now(),
          startedAt,
          totalQuestions: questions.length,
        }),
      );
      return;
    }

    advance();
  };

  return (
    <View style={styles.content}>
      <View style={styles.body}>
        <ThemedText type="description" style={styles.progress}>
          {`${questionIndex + 1}/${questions.length}`}
        </ThemedText>
        <ThemedText type="bodyStrong">{currentQuestion.prompt}</ThemedText>
        <QuestionOptions
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          onSelectOption={(optionId) =>
            selectOption(optionId, currentQuestion.type === 'multiple_choice')
          }
          question={currentQuestion}
          resolvedCorrectOptionIds={resolvedCorrectOptionIds}
          selectedOptionIds={selectedOptionIds}
        />
        {isSubmitting ? (
          <ActivityIndicator color={colors.interactive} size="small" />
        ) : null}
        {isSubmitted ? (
          <AnswerFeedback
            explanation={
              submitResult?.explanation ?? currentQuestion.explanation
            }
            feedbackText={submitResult?.feedbackText}
            isCorrect={submitResult.isCorrect}
          />
        ) : null}
      </View>
      <QuizRunnerFooter
        action={
          isSubmitted && submitResult && renderSubmittedQuestionAction
            ? renderSubmittedQuestionAction(currentQuestion, submitResult)
            : undefined
        }
        isDisabled={
          isFinishing ||
          isSubmitting ||
          (!isSubmitted && selectedOptionIds.length === 0)
        }
        isLastQuestion={isLastQuestion}
        isSubmitted={isSubmitted}
        onPrimaryPress={() => {
          void handlePrimaryPress();
        }}
      />
    </View>
  );
}
