import { getApiErrorMessageKey } from '@/api/utils/getApiErrorMessageKey';
import { useBanner } from '@/components/banner';
import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import {
  useArticleQuizSessionQuery,
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
  type WikipediaArticleDetail,
} from '@/features/articles/api';
import { useAuth } from '@/features/auth';
import {
  QuizResult,
  QuizRunner,
  useCompleteQuizMutation,
  useSubmitQuizAnswerMutation,
  useRetakeQuizMutation,
  type QuizSessionResult,
  type QuizQuestion,
  type QuizSubmitResult,
} from '@/features/quiz';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { ArticleQuizMode } from '../../../../articleQuizSession';
import { useQuizVocabulary } from '../../hooks/useQuizVocabulary';
import { isVocabularyWordQuestion } from '../../utils/isVocabularyWordQuestion';
import { QuizExitConfirmation } from './components/quizExitConfirmation';
import { SaveVocabularyWordButton } from './components/saveVocabularyWordButton';
import { styles } from './styles';

type ArticleQuizSessionProps = {
  article: WikipediaArticleDetail;
  quizLevel: SimplifyArticleLevel;
  quizMode: ArticleQuizMode;
  quizSessionTargetLength: SimplifyArticleTargetLength;
};

export function ArticleQuizSession({
  article,
  quizLevel,
  quizMode,
  quizSessionTargetLength,
}: ArticleQuizSessionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentUser } = useAuth();
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { data: session } = useArticleQuizSessionQuery({
    articleId: article.id,
    mode: quizMode,
    level: quizLevel,
    targetLength: quizSessionTargetLength,
  });
  const [retakeSessionId, setRetakeSessionId] = useState<string>();
  const sessionId = retakeSessionId ?? session?.sessionId;
  const progressMutation = useCompleteQuizMutation({
    sessionId,
    onCompleted: setResult,
  });
  const answerMutation = useSubmitQuizAnswerMutation();
  const retakeMutation = useRetakeQuizMutation((nextSessionId) => {
    setRetakeSessionId(nextSessionId);
    setResult(null);
    setAttempt((current) => current + 1);
  });
  const { showBanner } = useBanner();
  const showError = (error: unknown) => {
    const key = getApiErrorMessageKey(error);
    if (key) showBanner({ title: t(key), variant: 'error' });
  };
  const vocabulary = useQuizVocabulary(article.title);
  const title =
    quizMode === 'vocabulary'
      ? t('article.quiz.vocabularyKnowledge')
      : t('article.quiz.articleKnowledge');
  const renderVocabularySaveAction = (
    question: QuizQuestion,
    answer: QuizSubmitResult,
  ) => {
    // Word details arrive with feedback, after this question's first graded attempt.
    const vocabularyQuestion = { ...question, ...answer.vocabularyWord };
    if (
      quizMode !== 'vocabulary' ||
      !currentUser?.id ||
      !isVocabularyWordQuestion(vocabularyQuestion)
    )
      return null;
    return (
      <SaveVocabularyWordButton
        saved={vocabulary.savedQuestionIds.has(vocabularyQuestion.id)}
        saving={vocabulary.savingQuestionId === vocabularyQuestion.id}
        onSave={() => vocabulary.saveWord(vocabularyQuestion)}
      />
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <Stack.Screen options={{ title }} />
      {result ? (
        <QuizResult
          result={result}
          title={title}
          shouldShowTitle={false}
          onDone={() => router.back()}
          onRetry={() => {
            if (sessionId && !retakeMutation.isPending)
              retakeMutation.mutate(sessionId, { onError: showError });
          }}
        />
      ) : session?.questions.length ? (
        <QuizRunner
          key={`article-quiz-${attempt}`}
          questions={session.questions}
          isFinishing={progressMutation.isPending}
          onSubmitAnswer={(question, selectedOptionIds) => {
            if (!sessionId) throw new Error('Missing quiz session.');
            return answerMutation.mutateAsync({
              sessionId,
              questionId: question.id,
              selectedOptionIds,
            });
          }}
          onSubmitError={showError}
          renderSubmittedQuestionAction={renderVocabularySaveAction}
          onFinish={(completed) => {
            progressMutation.mutate(completed);
          }}
        />
      ) : (
        <View style={styles.setupContent}>
          <View style={styles.setupBody}>
            <ThemedText type="screenTitle">{article.title}</ThemedText>
            <ThemedText type="description">
              {t('article.quiz.missingGeneratedQuiz')}
            </ThemedText>
          </View>
          <View style={styles.setupFooter}>
            <Button onPress={() => router.back()} style={styles.setupButton}>
              {t('translation.close')}
            </Button>
          </View>
        </View>
      )}
      <QuizExitConfirmation
        active={Boolean(session?.questions.length) && result === null}
      />
    </ScreenContainer>
  );
}
