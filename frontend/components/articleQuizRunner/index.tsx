import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
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

            return (
              <Button
                disabled={isSubmitted || isSubmitting}
                key={option.id}
                onPress={() => handleSelectOption(option.id)}
                style={[
                  isSubmitted && isCorrectOption ? styles.correctOption : null,
                  isSubmitted && isSelected && !isCorrectOption
                    ? styles.wrongOption
                    : null,
                ]}
                variant={isSelected ? 'primary' : 'secondary'}>
                {option.text}
              </Button>
            );
          })}
        </View>
        {isSubmitting ? (
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].tint} size="small" />
        ) : null}
        {isSubmitted ? (
          <ThemedText type="bodyStrong">
            {submitResult?.feedbackText
              ? submitResult.feedbackText
              : isAnswerCorrect
              ? t('dictionary.test.correct')
              : t('article.quiz.incorrect', { defaultValue: 'Incorrect' })}
          </ThemedText>
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
            : t('article.quiz.check', { defaultValue: 'Check answer' })}
        </Button>
      </View>
    </View>
  );
}
