import { type ReactNode, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  type QuizQuestion,
  type QuizSessionResult,
  type QuizSubmitResult,
} from '../../types';

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
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<QuizSubmitResult | null>(
    null,
  );
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

    return (
      submitResult?.correctOptionIds ?? currentQuestion.correctOptionIds ?? []
    );
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

  const handlePrimaryPress = () => {
    if (!isSubmitted) {
      if (selectedOptionIds.length === 0) {
        return;
      }

      setIsSubmitting(true);

      const onSuccess = (result: QuizSubmitResult) => {
        if (result.isCorrect) setCorrectAnswers((current) => current + 1);
        setSubmitResult(result);
        setIsSubmitted(true);
      };
      if (onSubmitAnswer) {
        const callbacks: QuizAnswerCallbacks = {
          onSuccess,
          onError: (error) => {
            if (!onSubmitError) throw error;
            onSubmitError(error);
          },
          onSettled: () => setIsSubmitting(false),
        };
        try {
          onSubmitAnswer(currentQuestion, selectedOptionIds, callbacks);
        } catch (error) {
          try {
            callbacks.onError(error);
          } finally {
            callbacks.onSettled();
          }
        }
      } else {
        onSuccess({
          explanation: currentQuestion.explanation,
          isCorrect: isAnswerSelectionCorrect(
            selectedOptionIds,
            currentQuestion.correctOptionIds ?? [],
          ),
        });
        setIsSubmitting(false);
      }
      return;
    }

    if (isLastQuestion) {
      onFinish(
        createQuizSessionResult({
          correctAnswers,
          finishedAt: Date.now(),
          startedAt,
          totalQuestions: questions.length,
        }),
      );
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
        <QuestionOptions
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          onSelectOption={handleSelectOption}
          question={currentQuestion}
          resolvedCorrectOptionIds={resolvedCorrectOptionIds}
          selectedOptionIds={selectedOptionIds}
        />
        {isSubmitting ? (
          <ActivityIndicator
            color={Colors[colorScheme ?? 'light'].tint}
            size="small"
          />
        ) : null}
        {isSubmitted ? (
          <AnswerFeedback
            explanation={
              submitResult?.explanation ?? currentQuestion.explanation
            }
            feedbackText={submitResult?.feedbackText}
            isCorrect={isAnswerCorrect}
            isDarkTheme={isDarkTheme}
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
