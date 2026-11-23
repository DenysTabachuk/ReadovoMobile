import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { VocabularyLessonWord } from '@/api/generated/transport';
import { Button } from '@/components/button';
import { ProgressBar } from '@/components/progressBar';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { WordCard } from './components/wordCard';
import { createStyles } from './styles';

type WordCardsProps = {
  title: string;
  words: VocabularyLessonWord[];
  onContinue: () => void;
};

export function WordCards({ title, words, onContinue }: WordCardsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [cardIndex, setCardIndex] = useState(0);
  const total = words.length;
  const index = Math.min(cardIndex, total - 1);
  const card = words[index];
  const isLastCard = index === total - 1;
  if (!card) return null;
  return (
    <ScrollableScreen
      key={card.id}
      edges={[]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.progressHeader}>
        <ThemedText style={styles.secondary}>{title}</ThemedText>
        <ThemedText type="bodyStrong">
          {t('vocabulary.cards.position', { current: index + 1, total })}
        </ThemedText>
      </View>
      <ProgressBar
        accessibilityLabel={t('vocabulary.cards.progress')}
        minimum={1}
        total={total}
        value={index + 1}
      />
      <WordCard key={card.id} card={card} />
      <View style={styles.controls}>
        <Button
          variant="secondary"
          disabled={index === 0}
          accessibilityState={{ disabled: index === 0 }}
          onPress={() => setCardIndex(Math.max(0, index - 1))}
          style={styles.previous}
        >
          {t('vocabulary.cards.previous')}
        </Button>
        <Button
          onPress={() => {
            if (isLastCard) {
              onContinue();
              return;
            }
            setCardIndex(Math.min(total - 1, index + 1));
          }}
          style={styles.next}
        >
          {isLastCard
            ? t('vocabulary.cards.continue')
            : t('vocabulary.cards.next')}
        </Button>
      </View>
      <ThemedText style={styles.attribution}>
        {t('vocabulary.cards.progressNotSaved')}
      </ThemedText>
    </ScrollableScreen>
  );
}
