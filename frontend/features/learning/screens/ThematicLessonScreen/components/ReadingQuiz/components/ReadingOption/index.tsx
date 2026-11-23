import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import type { LearningReadingOption } from '@/api/generated/transport';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type ReadingOptionProps = {
  option: LearningReadingOption;
  position: number;
  selected: boolean;
  disabled: boolean;
  correct: boolean;
  incorrect: boolean;
  onSelect: (optionId: string) => void;
};

/** Renders a numbered reading choice and its selection or grading state. */
export function ReadingOption({
  option,
  position,
  selected,
  disabled,
  correct,
  incorrect,
  onSelect,
}: ReadingOptionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={option.text}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={() => onSelect(option.id)}
      style={[
        styles.option,
        selected && styles.selected,
        correct && styles.correct,
        incorrect && styles.incorrect,
      ]}
    >
      <View style={[styles.marker, selected && styles.selectedMarker]}>
        <ThemedText
          type="bodyStrong"
          style={selected && styles.selectedMarkerText}
        >
          {position}
        </ThemedText>
      </View>
      <ThemedText style={[styles.optionText, selected && styles.selectedText]}>
        {option.text}
      </ThemedText>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={22}
          color={colors.interactive}
          accessible={false}
        />
      )}
    </Pressable>
  );
}
