import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { LearningVariant } from '@/api/generated/transport';
import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import {
  TOPIC_COVERS,
  DEFAULT_TOPIC_COVER,
} from '../../../../assets/topic-covers';
import { highlightReadingWords } from '../../../../utils/highlightReadingWords';
import { createStyles } from './styles';
import { ReadingParagraph } from './components/readingParagraph';

type ReadingProps = {
  variant: LearningVariant;
  coverImageKey: string | null;
  onContinue: () => void;
};

export function Reading({ variant, coverImageKey, onContinue }: ReadingProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [largeText, setLargeText] = useState(false);
  const paragraphs = useMemo(
    () =>
      variant.readingParagraphs.map((paragraph) =>
        highlightReadingWords(
          paragraph,
          variant.vocabulary.words.map((word) => word.word),
        ),
      ),
    [variant],
  );
  let source = DEFAULT_TOPIC_COVER;
  if (coverImageKey !== null)
    source = TOPIC_COVERS.get(coverImageKey) ?? DEFAULT_TOPIC_COVER;
  return (
    <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
      <View style={styles.cover}>
        <Image
          source={source}
          style={styles.coverLayer}
          contentFit="cover"
          accessible={false}
        />
        <LinearGradient
          colors={['transparent', colors.imageFadeMid, colors.background]}
          locations={[0.25, 0.58, 1]}
          style={styles.coverLayer}
          pointerEvents="none"
        />
      </View>
      <View style={styles.tools}>
        <ThemedText type="bodyStrong" style={styles.eyebrow}>
          {t('learning.reader.label', { level: variant.level })}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('learning.reader.largeText')}
          accessibilityState={{ selected: largeText }}
          onPress={() => setLargeText(!largeText)}
          style={styles.textSize}
        >
          <ThemedText type="sectionTitle">Aa</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="screenTitle" style={styles.title}>
        {variant.readingTitle}
      </ThemedText>
      <View style={styles.paragraphs}>
        {paragraphs.map((parts, index) => (
          <ReadingParagraph key={index} parts={parts} largeText={largeText} />
        ))}
      </View>
      <View style={styles.checkPanel}>
        <Image
          source={require('../../../../assets/lesson-art/reading-check.png')}
          style={styles.checkIllustration}
          contentFit="contain"
          accessible={false}
        />
        <View style={styles.checkCopy}>
          <ThemedText type="sectionTitle" style={styles.checkTitle}>
            {t('learning.reader.checkTitle')}
          </ThemedText>
          <ThemedText style={styles.secondary}>
            {t('learning.reader.questions', {
              count: variant.questions.length,
            })}
          </ThemedText>
        </View>
      </View>
      <Button onPress={onContinue}>{t('learning.lesson.comprehension')}</Button>
    </ScrollableScreen>
  );
}
