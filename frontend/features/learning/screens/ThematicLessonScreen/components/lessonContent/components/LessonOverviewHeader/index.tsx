import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LearningArtwork } from '@/features/learningMedia';
import { createStyles } from './styles';

type LessonOverviewHeaderProps = {
  title: string;
  description: string;
  coverImageUrl: string | null;
};

export function LessonOverviewHeader({
  title,
  description,
  coverImageUrl,
}: LessonOverviewHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.header}>
      <LearningArtwork
        imageUrl={coverImageUrl}
        style={styles.image}
        contentFit="cover"
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
