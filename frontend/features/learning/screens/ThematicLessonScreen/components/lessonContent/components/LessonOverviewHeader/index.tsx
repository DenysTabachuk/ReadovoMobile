import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import {
  LearningArtwork,
  useCachedLearningMedia,
} from '@/features/learningMedia';
import { useCachedTopicCover } from '../../../../../../api/queries/useCachedTopicCover';
import { createStyles } from './styles';

type LessonOverviewHeaderProps = {
  title: string;
  description: string;
  topicSlug: string;
  coverImageUrl: string | null;
};

export function LessonOverviewHeader({
  title,
  description,
  topicSlug,
  coverImageUrl,
}: LessonOverviewHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const thumbnailUrl = useCachedTopicCover(topicSlug);
  const previewSource = useCachedLearningMedia(
    thumbnailUrl === coverImageUrl ? null : thumbnailUrl,
  );
  return (
    <View style={styles.header}>
      <LearningArtwork
        imageUrl={coverImageUrl}
        style={styles.image}
        contentFit="cover"
        previewSource={previewSource}
        showLoadingIndicator={false}
      />
      <LinearGradient
        colors={['transparent', colors.imageFadeMid, colors.background]}
        locations={[0.25, 0.58, 1]}
        style={styles.overlay}
      >
        <ThemedText type="screenTitle" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </LinearGradient>
    </View>
  );
}
