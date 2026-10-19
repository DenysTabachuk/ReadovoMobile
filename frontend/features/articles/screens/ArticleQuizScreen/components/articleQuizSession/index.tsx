import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import {
  useArticleQuizSessionQuery,
  useCompleteArticleQuizMutation,
  type ArticleQuizLengthParam,
  type SimplifyArticleLevel,
  type SimplifyArticleTargetLength,
  type WikipediaArticleDetail,
} from '@/features/articles/api';
import { useAuth } from '@/features/auth';
import {
  QuizResult,
  QuizRunner,
  type QuizSessionResult,
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
  quizTargetLength: ArticleQuizLengthParam;
  quizSessionTargetLength: SimplifyArticleTargetLength;
};

export function ArticleQuizSession({
  article,
  quizLevel,
  quizMode,
  quizTargetLength,
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
  const progressMutation = useCompleteArticleQuizMutation({
    article,
    currentUserId: currentUser?.id ?? undefined,
    quizLevel,
    quizTargetLength,
  });
  const vocabulary = useQuizVocabulary(article.title);
  const title =
    quizMode === 'vocabulary'
      ? t('article.quiz.vocabularyKnowledge')
      : t('article.quiz.articleKnowledge');
  const renderVocabularySaveAction = (question: unknown) => {
    if (
      quizMode !== 'vocabulary' ||
      !currentUser?.id ||
      !isVocabularyWordQuestion(question)
    )
      return null;
    return (
      <SaveVocabularyWordButton
        saved={vocabulary.savedQuestionIds.has(question.id)}
        saving={vocabulary.savingQuestionId === question.id}
        onSave={() => vocabulary.saveWord(question)}
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
            setResult(null);
            setAttempt((current) => current + 1);
          }}
        />
      ) : session?.questions.length ? (
        <QuizRunner
          key={`article-quiz-${attempt}`}
          questions={session.questions}
          renderSubmittedQuestionAction={renderVocabularySaveAction}
          onFinish={(completed) => {
            setResult(completed);
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
