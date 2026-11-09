import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { COMMON_THINGS_LESSON_ID } from '../../fixtures/lessons';
import { useVocabularyPractice } from '../../hooks/useVocabularyPractice';
import { PICTURE_PRACTICE_QUESTIONS } from '../../fixtures/picturePractice';
import { PracticeProgress } from '../practiceProgress';
import { PictureOption } from './components/pictureOption';
import { PracticeResult } from '../practiceResult';
import { createStyles } from './styles';
import type { VocabularyWordCard } from '../../fixtures/wordCards';

type PicturePracticeProps = {
  titleKey: string;
  sampleKey: string;
  renderPrompt: (word: VocabularyWordCard, questionId: string) => ReactNode;
  resultAction?: ReactNode;
};

export function PicturePractice({
  titleKey,
  sampleKey,
  renderPrompt,
  resultAction,
}: PicturePracticeProps) {
  const { lessonId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const practice = useVocabularyPractice(PICTURE_PRACTICE_QUESTIONS);
  const { question, answer, questionIndex, total } = practice;
  if (lessonId !== COMMON_THINGS_LESSON_ID)
    return (
      <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
        <ThemedText type="screenTitle">{t('vocabulary.notFound')}</ThemedText>
        <Button onPress={() => router.replace('/(tabs)/(learning)/vocabulary')}>
          {t('vocabulary.backToLessons')}
        </Button>
      </ScrollableScreen>
    );

  if (practice.isComplete)
    return (
      <ScrollableScreen
        key="result"
        edges={[]}
        contentContainerStyle={styles.content}
      >
        <PracticeResult
          answers={practice.answers}
          total={total}
          correctCount={practice.correctCount}
          onRestart={practice.restart}
        >
          {resultAction}
        </PracticeResult>
      </ScrollableScreen>
    );

  if (!question) return null;
  let feedbackKey = 'vocabulary.practice.incorrect';
  if (answer?.isCorrect) feedbackKey = 'vocabulary.practice.correct';
  let actionKey = 'vocabulary.practice.check';
  if (answer) {
    actionKey = 'vocabulary.cards.next';
    if (questionIndex === total - 1)
      actionKey = 'vocabulary.practice.showResult';
  }

  return (
    <ScrollableScreen
      key={question.id}
      edges={[]}
      contentContainerStyle={styles.content}
    >
      <PracticeProgress
        title={t(titleKey)}
        sample={t(sampleKey, { count: total })}
        current={questionIndex + 1}
        total={total}
        answered={practice.answers.length}
      />
      {renderPrompt(question.word, question.id)}
      <View style={styles.options} accessibilityRole="radiogroup">
        {question.options.map((option, index) => (
          <PictureOption
            key={option.id}
            option={option}
            position={index + 1}
            selected={practice.selectedOptionId === option.id}
            checked={Boolean(answer)}
            correct={option.id === question.word.id}
            onSelect={() => practice.selectOption(question.id, option.id)}
          />
        ))}
      </View>
      {answer && (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedback,
            answer.isCorrect
              ? styles.correctFeedback
              : styles.incorrectFeedback,
          ]}
        >
          <ThemedText type="sectionTitle">{t(feedbackKey)}</ThemedText>
          <ThemedText>
            {t('vocabulary.practice.answerExplanation', {
              word: question.word.word,
              translation: t(question.word.translationKey),
            })}
          </ThemedText>
        </View>
      )}
      <Button
        disabled={practice.selectedOptionId === null}
        accessibilityState={{ disabled: practice.selectedOptionId === null }}
        onPress={() => {
          if (answer) practice.advance(question.id);
          else practice.checkAnswer(question.id);
        }}
      >
        {t(actionKey)}
      </Button>
      <ThemedText style={styles.credit}>
        {t('vocabulary.cards.imageCredit')}
      </ThemedText>
    </ScrollableScreen>
  );
}
