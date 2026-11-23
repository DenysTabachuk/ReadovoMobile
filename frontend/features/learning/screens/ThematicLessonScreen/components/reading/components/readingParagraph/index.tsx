import { useMemo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { highlightReadingWords } from '../../../../../../utils/highlightReadingWords';
import { createStyles } from './styles';

type ReadingParagraphProps = {
  parts: ReturnType<typeof highlightReadingWords>;
  largeText: boolean;
};

export function ReadingParagraph({ parts, largeText }: ReadingParagraphProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View>
      {/* Android cannot color an underline independently of its text. Identical
          native text layouts keep the gold underline below the warm foreground
          glyphs, preserving wrapping and font scaling without inline views. */}
      <ThemedText
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[
          styles.paragraph,
          largeText && styles.largeParagraph,
          styles.underlay,
        ]}
      >
        {parts.map((part, index) => (
          <ThemedText
            key={index}
            style={[
              styles.paragraph,
              largeText && styles.largeParagraph,
              styles.invisibleText,
              part.highlighted && styles.highlight,
            ]}
          >
            {part.text}
          </ThemedText>
        ))}
      </ThemedText>
      <ThemedText
        style={[styles.paragraph, largeText && styles.largeParagraph]}
      >
        {parts.map((part, index) => (
          <ThemedText
            key={index}
            style={[styles.paragraph, largeText && styles.largeParagraph]}
          >
            {part.text}
          </ThemedText>
        ))}
      </ThemedText>
    </View>
  );
}
