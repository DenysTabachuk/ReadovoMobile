import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { COMMON_THINGS_LESSON_ID } from '../../fixtures/lessons';
import { COMMON_THINGS_WORD_CARDS } from '../../fixtures/wordCards';
import { WordCard } from './components/wordCard';
import { createStyles } from './styles';

export default function VocabularyWordsScreen() {
  const { lessonId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [cardIndex, setCardIndex] = useState(0);
  const card = COMMON_THINGS_WORD_CARDS[cardIndex];
  const total = COMMON_THINGS_WORD_CARDS.length;
  const isLastCard = cardIndex === total - 1;

  if (lessonId !== COMMON_THINGS_LESSON_ID || !card) {
    return (
      <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
        <ThemedText type="screenTitle">{t('vocabulary.notFound')}</ThemedText>
        <Button onPress={() => router.replace('/(tabs)/(learning)/vocabulary')}>
          {t('vocabulary.backToLessons')}
        </Button>
      </ScrollableScreen>
    );
  }

  return (
    <ScrollableScreen
      key={card.id}
      edges={[]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.progressHeader}>
        <ThemedText style={styles.secondary}>
          {t('vocabulary.cards.sample', { count: total })}
        </ThemedText>
        <ThemedText type="bodyStrong">
          {t('vocabulary.cards.position', { current: cardIndex + 1, total })}
        </ThemedText>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={t('vocabulary.cards.progress')}
        accessibilityValue={{ min: 1, max: total, now: cardIndex + 1 }}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${((cardIndex + 1) / total) * 100}%` },
          ]}
        />
      </View>
      <WordCard key={card.id} card={card} />
      <View style={styles.controls}>
        <Button
          variant="secondary"
          disabled={cardIndex === 0}
          accessibilityState={{ disabled: cardIndex === 0 }}
          onPress={() => setCardIndex((index) => Math.max(0, index - 1))}
          style={styles.previous}
        >
          {t('vocabulary.cards.previous')}
        </Button>
        <Button
          onPress={() => {
            if (isLastCard) {
              router.dismissTo({
                pathname: '/(tabs)/(learning)/vocabulary/[lessonId]',
                params: { lessonId: COMMON_THINGS_LESSON_ID },
              });
              return;
            }
            setCardIndex((index) => Math.min(total - 1, index + 1));
          }}
          style={styles.next}
        >
          {isLastCard
            ? t('vocabulary.cards.backToLesson')
            : t('vocabulary.cards.next')}
        </Button>
      </View>
      <ThemedText style={styles.attribution}>
        {t('vocabulary.cards.imageCredit')}
      </ThemedText>
    </ScrollableScreen>
  );
}
