import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { PracticeProgress } from '../../components/practiceProgress';
import { PracticeResult } from '../../components/practiceResult';
import { COMMON_THINGS_LESSON_ID } from '../../fixtures/lessons';
import { SENTENCE_PRACTICE_QUESTIONS } from '../../fixtures/sentencePractice';
import { useVocabularyPractice } from '../../hooks/useVocabularyPractice';
import { WordOption } from './components/wordOption';
import { createStyles } from './styles';

export default function VocabularySentencePracticeScreen() {
  const { lessonId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const practice = useVocabularyPractice(SENTENCE_PRACTICE_QUESTIONS);
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
  let actionKey = 'vocabulary.practice.check';
  if (answer) {
    actionKey = 'vocabulary.cards.next';
    if (questionIndex === total - 1)
      actionKey = 'vocabulary.practice.showResult';
  }
  let feedbackKey = 'vocabulary.practice.incorrect';
  if (answer?.isCorrect) feedbackKey = 'vocabulary.practice.correct';

  return (
    <ScrollableScreen
      key={question.id}
      edges={[]}
      contentContainerStyle={styles.content}
    >
      <PracticeProgress
        title={t('vocabulary.sentence.title')}
        sample={t('vocabulary.sentence.sample', { count: total })}
        current={questionIndex + 1}
        total={total}
        answered={practice.answers.length}
      />
      <ThemedText type="description">
        {t('vocabulary.sentence.chooseWord')}
      </ThemedText>
      <View style={styles.sentencePanel}>
        <ThemedText type="sectionTitle" accessibilityLanguage="en-US">
          {question.beforeGap}
          <ThemedText type="sectionTitle" style={styles.gap}>
            {answer ? question.word.word.toLowerCase() : '___'}
          </ThemedText>
          {question.afterGap}
        </ThemedText>
      </View>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {question.options.map((option) => (
          <WordOption
            key={option.id}
            word={option.word.toLowerCase()}
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
          <ThemedText>{t(question.translationKey)}</ThemedText>
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
    </ScrollableScreen>
  );
}
