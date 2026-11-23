import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LearningEntry } from '@/api/generated/transport';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { LearningArtwork } from '../../../../components/LearningArtwork';
import { createStyles } from './styles';

type TopicCardProps = {
  topic: LearningEntry;
  onPress: () => void;
};

export function TopicCard({ topic, onPress }: TopicCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={topic.title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LearningArtwork
        imageUrl={topic.coverImageUrl}
        style={styles.cover}
        contentFit="cover"
      />
      <View style={styles.footer}>
        <View style={styles.copy}>
          <ThemedText type="sectionTitle">{topic.title}</ThemedText>
          <ThemedText style={styles.secondary}>{topic.description}</ThemedText>
        </View>
        <Ionicons
          name="arrow-forward-outline"
          size={28}
          color={colors.interactive}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}
