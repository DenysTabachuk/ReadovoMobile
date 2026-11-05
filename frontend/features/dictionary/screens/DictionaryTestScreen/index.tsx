import { useTheme } from '@/hooks/use-theme';
import {
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getDictionaryErrorMessageKey } from '../../utils/getDictionaryErrorMessageKey';

import {
  useGenerateDictionaryTestMutation,
  type DictionaryTest,
} from '../../api';
import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import {
  useCompleteQuizMutation,
  useQuizCompletionFeedback,
  useSubmitQuizAnswerMutation,
  QuizResult,
  QuizRunner,
  type QuizQuestion,
  type QuizSessionResult,
  type QuizSubmitResult,
} from '@/features/quiz';
import { useBanner } from '@/components/banner';

import { styles } from './styles';

export default function DictionaryTestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { showBanner } = useBanner();
  const { colors } = useTheme();
  const [test, setTest] = useState<DictionaryTest>();
  const [testResult, setTestResult] = useState<QuizSessionResult | null>(null);
  const [isExitTestConfirmOpen, setIsExitTestConfirmOpen] = useState(false);
  const [pendingExitAction, setPendingExitAction] =
    useState<NavigationAction | null>(null);

  const quizQuestions = useMemo<QuizQuestion[]>(() => {
    if (!test) {
      return [];
    }

    return test.questions.map((question) => ({
      id: question.wordId,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text ?? option.translation,
      })),
      prompt:
        question.prompt ||
        `${t('dictionary.test.questionLabel')}: ${question.word}`,
      type: 'single_choice' as const,
    }));
  }, [t, test]);

  const testMutation = useGenerateDictionaryTestMutation();
  const { mutate: generateTest } = testMutation;

  const answerMutation = useSubmitQuizAnswerMutation();
  const progressMutation = useCompleteQuizMutation(test?.sessionId);
  const completionFeedback = useQuizCompletionFeedback((completed) => {
    setTestResult(completed);
    setTest(undefined);
  });

  const shouldConfirmExit = quizQuestions.length > 0 && testResult === null;

  usePreventRemove(shouldConfirmExit, ({ data }) => {
    setPendingExitAction(data.action);
    setIsExitTestConfirmOpen(true);
  });

  useEffect(() => {
    generateTest(undefined, { onSuccess: setTest });
  }, [generateTest]);

  const handleConfirmExitTest = useCallback(() => {
    setIsExitTestConfirmOpen(false);
    setTest(undefined);

    if (pendingExitAction) {
      navigation.dispatch(pendingExitAction);
      setPendingExitAction(null);
      return;
    }

    router.back();
  }, [navigation, pendingExitAction, router]);

  const handleFinishTest = useCallback(
    (result: QuizSessionResult) => {
      progressMutation.mutate(result, completionFeedback);
    },
    [progressMutation, completionFeedback],
  );

  const handleRetryTest = useCallback(() => {
    setTestResult(null);
    testMutation.mutate(undefined, { onSuccess: setTest });
  }, [testMutation]);

  const handleSubmitAnswer: NonNullable<
    ComponentProps<typeof QuizRunner>['onSubmitAnswer']
  > = (question, selectedOptionIds, { onSuccess, onError, onSettled }) => {
    if (!test?.sessionId) throw new Error('Missing quiz session.');

    const handleAnswerSuccess = (result: QuizSubmitResult) => {
      let feedbackText = t('dictionary.test.correct');

      if (!result.isCorrect) {
        const correctOptionText = question.options.find((option) =>
          result.correctOptionIds?.includes(option.id),
        )?.text;
        feedbackText = t('dictionary.test.incorrect', {
          translation: correctOptionText,
        });
      }

      onSuccess({ ...result, feedbackText });
    };

    answerMutation.mutate(
      {
        sessionId: test.sessionId,
        questionId: question.id,
        selectedOptionIds,
      },
      { onSuccess: handleAnswerSuccess, onError, onSettled },
    );
  };

  const testErrorMessageKey = testMutation.error
    ? getDictionaryErrorMessageKey(testMutation.error)
    : null;
  return (
    <ScreenContainer style={styles.container}>
      <Stack.Screen options={{ title: t('dictionary.test.title') }} />
      {testMutation.isPending ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.interactive} size="large" />
          <ThemedText type="body">{t('dictionary.test.loading')}</ThemedText>
        </View>
      ) : testErrorMessageKey ? (
        <View style={styles.centerState}>
          <ThemedText type="screenTitle" style={styles.centerTitle}>
            {t('dictionary.test.errorTitle')}
          </ThemedText>
          <ThemedText type="description" style={styles.centerDescription}>
            {t(testErrorMessageKey)}
          </ThemedText>
          <Button onPress={handleRetryTest}>{t('dictionary.retry')}</Button>
        </View>
      ) : testResult ? (
        <QuizResult
          onDone={() => router.back()}
          onRetry={handleRetryTest}
          result={testResult}
          shouldShowTitle={false}
          title={t('dictionary.test.title')}
        />
      ) : quizQuestions.length > 0 ? (
        <QuizRunner
          isFinishing={progressMutation.isPending}
          onFinish={handleFinishTest}
          onSubmitAnswer={handleSubmitAnswer}
          onSubmitError={(error) => {
            const messageKey = getDictionaryErrorMessageKey(error);
            if (messageKey)
              showBanner({ title: t(messageKey), variant: 'error' });
          }}
          questions={quizQuestions}
        />
      ) : null}
      <ModalSheet
        footer={
          <View style={styles.confirmModalActions}>
            <Button
              onPress={() => {
                setPendingExitAction(null);
                setIsExitTestConfirmOpen(false);
              }}
              style={styles.confirmModalButton}
              variant="secondary"
            >
              {t('dictionary.test.exitCancel')}
            </Button>
            <Button
              onPress={handleConfirmExitTest}
              style={styles.confirmModalButton}
            >
              {t('dictionary.test.exitConfirm')}
            </Button>
          </View>
        }
        onClose={() => {
          setPendingExitAction(null);
          setIsExitTestConfirmOpen(false);
        }}
        open={isExitTestConfirmOpen}
        title={t('dictionary.test.exitTitle')}
      >
        <ThemedText type="body">
          {t('dictionary.test.exitDescription')}
        </ThemedText>
      </ModalSheet>
    </ScreenContainer>
  );
}
