import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LearningVariant } from '@/api/generated/transport';
import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LearningArtwork } from '../../../../components/LearningArtwork';
import { highlightReadingWords } from '../../../../utils/highlightReadingWords';
import { createStyles } from './styles';
import { ReadingParagraph } from './components/readingParagraph';

type LessonReadingActivityProps = {
  variant: LearningVariant;
  readingImageUrl: string | null;
  readingCheckImageUrl: string | null;
  onContinue: () => void;
};

export function LessonReadingActivity({
  variant,
  readingImageUrl,
  readingCheckImageUrl,
  onContinue,
}: LessonReadingActivityProps) {
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
  return (
    <ScrollableScreen edges={[]} contentContainerStyle={styles.content}>
      <View style={styles.cover}>
        <LearningArtwork
          imageUrl={readingImageUrl}
          style={styles.coverLayer}
          contentFit="cover"
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
        <LearningArtwork
          imageUrl={readingCheckImageUrl}
          fallback={null}
          style={styles.checkIllustration}
          contentFit="contain"
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
