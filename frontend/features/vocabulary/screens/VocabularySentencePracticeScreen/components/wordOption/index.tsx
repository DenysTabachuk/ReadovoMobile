import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMemo } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type WordOptionProps = {
  word: string;
  selected: boolean;
  checked: boolean;
  correct: boolean;
  onSelect: () => void;
};

export function WordOption({
  word,
  selected,
  checked,
  correct,
  onSelect,
}: WordOptionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  let outcomeStyle: StyleProp<ViewStyle>;
  let outcomeIcon;
  if (checked && correct) {
    outcomeStyle = styles.correct;
    outcomeIcon = (
      <MaterialIcons name="check-circle" size={24} color={colors.success} />
    );
  } else if (checked && selected) {
    outcomeStyle = styles.incorrect;
    outcomeIcon = (
      <MaterialIcons name="cancel" size={24} color={colors.danger} />
    );
  }
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={word}
      accessibilityLanguage="en-US"
      accessibilityState={{ selected, disabled: checked }}
      disabled={checked}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        outcomeStyle,
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="bodyStrong" style={styles.word}>
        {word}
      </ThemedText>
      {outcomeIcon}
    </Pressable>
  );
}
