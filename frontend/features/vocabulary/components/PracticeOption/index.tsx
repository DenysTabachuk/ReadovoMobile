import { Ionicons } from '@expo/vector-icons';
import { useMemo, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { PracticeOptionInteractionProps } from './types';
import { createStyles } from './styles';

type PracticeOptionProps = PracticeOptionInteractionProps & {
  accessibilityLabel: string;
  accessibilityLanguage?: string;
  style: StyleProp<ViewStyle>;
  iconSize: number;
  children: (outcomeIcon: ReactNode) => ReactNode;
};

export function PracticeOption({
  accessibilityLabel,
  accessibilityLanguage,
  style,
  iconSize,
  selected,
  checked,
  disabled,
  correct,
  onSelect,
  children,
}: PracticeOptionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showCorrect = checked && correct;
  const showIncorrect = checked && selected && !correct;
  const outcomeIcon = (showCorrect || showIncorrect) && (
    <Ionicons
      name={correct ? 'checkmark-circle' : 'close-circle'}
      color={correct ? colors.success : colors.danger}
      size={iconSize}
    />
  );

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityLanguage={accessibilityLanguage}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={({ pressed }) => [
        style,
        selected && styles.selected,
        showCorrect && styles.correct,
        showIncorrect && styles.incorrect,
        pressed && styles.pressed,
      ]}
    >
      {children(outcomeIcon)}
    </Pressable>
  );
}
