import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { LearningArtwork } from '../../../../../../components/LearningArtwork';
import { styles } from './styles';

type ReadingQuizResultProps = {
  imageUrl: string | null;
  correctCount: number;
  total: number;
  onBack: () => void;
  onRestart: () => void;
  onRetryCompletion: () => void;
  completionPending: boolean;
  completionError: boolean;
};

/** Shows the reading score and provides recovery if saving completion failed. */
export function ReadingQuizResult({
  imageUrl,
  correctCount,
  total,
  onBack,
  onRestart,
  onRetryCompletion,
  completionPending,
  completionError,
}: ReadingQuizResultProps) {
  const { t } = useTranslation();

  return (
    <ScrollableScreen contentContainerStyle={styles.content}>
      <LearningArtwork
        imageUrl={imageUrl}
        fallback={null}
        style={styles.artwork}
        contentFit="cover"
      />
      <ThemedText type="screenTitle">
        {t('vocabulary.practice.resultTitle')}
      </ThemedText>
      <ThemedText type="heroTitle">
        {t('vocabulary.practice.score', { correct: correctCount, total })}
      </ThemedText>
      {completionError && (
        <View style={styles.retry}>
          <ThemedText accessibilityRole="alert">
            {t('learning.topics.libraryWriteError')}
          </ThemedText>
          <Button onPress={onRetryCompletion}>{t('article.retry')}</Button>
        </View>
      )}
      <Button disabled={completionPending} onPress={onRestart}>
        {t('vocabulary.practice.tryAgain')}
      </Button>
      <Button onPress={onBack}>{t('learning.lesson.back')}</Button>
    </ScrollableScreen>
  );
}
