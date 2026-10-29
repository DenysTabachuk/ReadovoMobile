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

type QuizRunnerProps = {
  onSubmitError?: (error: unknown) => void;
  onFinish: (result: QuizSessionResult) => void;
  renderSubmittedQuestionAction?: (question: QuizQuestion) => ReactNode;
  onSubmitAnswer?: (
    question: QuizQuestion,
    selectedOptionIds: string[],
  ) => Promise<QuizSubmitResult> | QuizSubmitResult;
  questions: QuizQuestion[];
};

export function QuizRunner({
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
          result = {
            explanation: currentQuestion.explanation,
            isCorrect: isAnswerSelectionCorrect(
              selectedOptionIds,
              currentQuestion.correctOptionIds ?? [],
            ),
          };
        }

        if (result.isCorrect) {
          setCorrectAnswers((current) => current + 1);
        }

        setSubmitResult(result);
      } catch (error) {
        if (!onSubmitError) throw error;
        onSubmitError(error);
        return;
      } finally {
        setIsSubmitting(false);
      }

      setIsSubmitted(true);
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
          isSubmitted && renderSubmittedQuestionAction
            ? renderSubmittedQuestionAction(currentQuestion)
            : undefined
        }
        isDisabled={
          isSubmitting || (!isSubmitted && selectedOptionIds.length === 0)
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
