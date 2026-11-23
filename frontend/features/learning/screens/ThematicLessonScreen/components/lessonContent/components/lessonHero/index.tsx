import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import {
  DEFAULT_TOPIC_COVER,
  TOPIC_COVERS,
} from '../../../../../../assets/topic-covers';
import { createStyles } from './styles';

type LessonHeroProps = {
  title: string;
  description: string;
  coverImageKey: string | null;
};

export function LessonHero({
  title,
  description,
  coverImageKey,
}: LessonHeroProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  let source = DEFAULT_TOPIC_COVER;
  if (coverImageKey !== null)
    source = TOPIC_COVERS.get(coverImageKey) ?? DEFAULT_TOPIC_COVER;
  return (
    <View style={styles.hero}>
      <Image
        source={source}
        style={styles.image}
        contentFit="cover"
        accessible={false}
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
