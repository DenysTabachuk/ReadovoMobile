import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type SentenceWithGapProps = {
  before: string | null;
  after: string | null;
  answerWord: string | null;
};

export function SentenceWithGap({
  before,
  after,
  answerWord,
}: SentenceWithGapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.panel}>
      <ThemedText type="sectionTitle" accessibilityLanguage="en-US">
        {before}
        <ThemedText type="sectionTitle" style={styles.gap}>
          {answerWord?.toLowerCase() ?? '___'}
        </ThemedText>
        {after}
      </ThemedText>
    </View>
  );
}
