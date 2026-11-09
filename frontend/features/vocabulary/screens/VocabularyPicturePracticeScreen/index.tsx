import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { COMMON_THINGS_LESSON_ID } from '../../fixtures/lessons';
import { usePicturePractice } from '../../hooks/usePicturePractice';
import { PictureOption } from './components/pictureOption';
import { PracticeResult } from './components/practiceResult';
import { createStyles } from './styles';

export default function VocabularyPicturePracticeScreen() {
  const { lessonId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const practice = usePicturePractice();
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
        />
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
      <View style={styles.progressHeading}>
        <ThemedText style={styles.secondary}>
          {t('vocabulary.practice.sample', { count: total })}
        </ThemedText>
        <ThemedText type="bodyStrong">
          {t('vocabulary.cards.position', {
            current: questionIndex + 1,
            total,
          })}
        </ThemedText>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={t('vocabulary.practice.title')}
        accessibilityValue={{
          min: 0,
          max: total,
          now: practice.answers.length,
        }}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${(practice.answers.length / total) * 100}%` },
          ]}
        />
      </View>
      <View style={styles.prompt}>
        <ThemedText type="description">
          {t('vocabulary.practice.choosePicture')}
        </ThemedText>
        <ThemedText type="heroTitle" accessibilityLanguage="en-US">
          {question.word.word}
        </ThemedText>
      </View>
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
