import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type {
  LearningReadingQuestion,
  VocabularyLevel,
} from '@/api/generated/transport';
import { Button } from '@/components/button';
import { ProgressBar } from '@/components/progressBar';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { ReadingOption } from './components/ReadingOption';
import { ReadingQuizResult } from './components/ReadingQuizResult';
import { useReadingQuiz } from './hooks/useReadingQuiz';
import { createStyles } from './styles';

type ReadingQuizProps = {
  slug: string;
  level: VocabularyLevel;
  questions: LearningReadingQuestion[];
  onBack: () => void;
  onComplete: () => void;
  completionPending: boolean;
  completionError: boolean;
};

export function ReadingQuiz({
  slug,
  level,
  questions,
  onBack,
  onComplete,
  completionPending,
  completionError,
}: ReadingQuizProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    question,
    answer,
    position,
    selectedOptionId,
    correctCount,
    isSubmitting,
    hasCheckError,
    selectOption,
    submit,
    restart,
  } = useReadingQuiz({ slug, level, questions, onComplete });
  if (!question) {
    return (
      <ReadingQuizResult
        correctCount={correctCount}
        total={questions.length}
        onBack={onBack}
        onRestart={restart}
        onRetryCompletion={onComplete}
        completionPending={completionPending}
        completionError={completionError}
      />
    );
  }
  const optionsDisabled = isSubmitting || answer !== null;

  return (
    <ScrollableScreen
      key={question.id}
      contentContainerStyle={styles.content}
      edges={[]}
    >
      <ThemedText type="bodyStrong" style={styles.secondary}>
        {t('learning.comprehension.position', {
          current: position,
          total: questions.length,
        })}
      </ThemedText>
      <ProgressBar
        accessibilityLabel={t('learning.comprehension.progress')}
        compact
        minimum={1}
        total={questions.length}
        value={position}
      />
      <ThemedText type="sectionTitle" style={styles.prompt}>
        {question.prompt}
      </ThemedText>
      {question.options.map((option, optionIndex) => (
        <ReadingOption
          key={option.id}
          option={option}
          position={optionIndex + 1}
          selected={selectedOptionId === option.id}
          disabled={optionsDisabled}
          correct={answer?.correctOptionId === option.id}
          incorrect={
            answer?.isCorrect === false && answer.selectedOptionId === option.id
          }
          onSelect={selectOption}
        />
      ))}
      {answer && (
        <View style={styles.feedback}>
          <ThemedText type="bodyStrong">
            {t(
              answer.isCorrect
                ? 'vocabulary.practice.correct'
                : 'vocabulary.practice.incorrect',
            )}
          </ThemedText>
          <ThemedText>{answer.explanation}</ThemedText>
        </View>
      )}
      {hasCheckError && (
        <ThemedText>{t('vocabulary.practice.checkError')}</ThemedText>
      )}
      <View style={styles.action}>
        {!answer && (
          <ThemedText style={styles.hint}>
            {t('learning.comprehension.chooseOne')}
          </ThemedText>
        )}
        <Button
          disabled={isSubmitting || selectedOptionId === null}
          onPress={submit}
        >
          {t(answer ? 'vocabulary.cards.next' : 'vocabulary.practice.check')}
        </Button>
      </View>
    </ScrollableScreen>
  );
}
