import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type {
  VocabularyLevel,
  VocabularyPracticeQuestion,
} from '@/api/generated/transport';
import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { usePrefetchPracticeArtwork } from '../../hooks/usePrefetchPracticeArtwork';
import { PracticeProgress } from '../practiceProgress';
import { PracticeResult } from '../practiceResult';
import { PictureExercise } from '../picturePractice';
import { SentenceGapExercise } from '../sentencePractice';
import { usePracticeSession } from './hooks/usePracticeSession';
import { createStyles } from './styles';

type PracticeSessionProps = {
  lessonSlug: string;
  level: VocabularyLevel;
  title: string;
  questions: VocabularyPracticeQuestion[];
  onBackToLesson: () => void;
  onContinue: () => void;
};

export function PracticeSession({
  lessonSlug,
  level,
  title,
  questions,
  onBackToLesson,
  onContinue,
}: PracticeSessionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    practice,
    isSubmitting,
    hasCheckError,
    isPrimaryActionDisabled,
    selectOption,
    submit,
    restart,
  } = usePracticeSession({ lessonSlug, level, questions });
  const { question, answer, total, questionIndex } = practice;
  usePrefetchPracticeArtwork(
    questions,
    practice.isComplete ? 'inactive' : 'session',
  );

  if (practice.isComplete)
    return (
      <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
        <PracticeResult
          answers={practice.answers}
          total={total}
          correctCount={practice.correctCount}
          onBackToLesson={onBackToLesson}
          onRestart={restart}
        >
          <Button onPress={onContinue}>
            {t('vocabulary.practice.nextStage')}
          </Button>
        </PracticeResult>
      </ScrollableScreen>
    );

  if (!question) return null;
  let actionKey = 'vocabulary.practice.check';
  if (answer) {
    actionKey = 'vocabulary.cards.next';
    if (questionIndex === total - 1)
      actionKey = 'vocabulary.practice.showResult';
  }
  const exerciseProps = {
    question,
    answer: answer ?? null,
    selectedOptionId: practice.selectedOptionId,
    isSubmitting,
    onSelect: selectOption,
  };

  return (
    <View style={styles.session}>
      <ScrollableScreen
        key={question.id}
        edges={[]}
        contentContainerStyle={styles.content}
      >
        <PracticeProgress
          title={title}
          subtitle={t('vocabulary.practice.questionCount', { count: total })}
          current={questionIndex + 1}
          total={total}
          answered={practice.answers.length}
        />
        {question.kind === 'sentence_gap' ? (
          <SentenceGapExercise {...exerciseProps} />
        ) : (
          <PictureExercise {...exerciseProps} />
        )}
        {hasCheckError && (
          <ThemedText accessibilityLiveRegion="polite">
            {t('vocabulary.practice.checkError')}
          </ThemedText>
        )}
      </ScrollableScreen>
      <View style={styles.footer}>
        <Button
          disabled={isPrimaryActionDisabled}
          accessibilityState={{
            disabled: isPrimaryActionDisabled,
            busy: isSubmitting,
          }}
          onPress={submit}
        >
          {t(actionKey)}
        </Button>
      </View>
    </View>
  );
}
