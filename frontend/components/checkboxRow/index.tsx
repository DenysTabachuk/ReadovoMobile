import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themedText';

import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

type CheckboxRowProps = {
  checked: boolean;
  label: string;
  onPress: PressableProps['onPress'];
};

type CheckboxIndicatorProps = {
  checked: boolean;
  checkedColor?: string;
  uncheckedColor?: string;
};

export function CheckboxRow({ checked, label, onPress }: CheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      style={styles.root}
      onPress={onPress}
    >
      <CheckboxIndicator checked={checked} />
      <ThemedText type="body">{label}</ThemedText>
    </Pressable>
  );
}

export function CheckboxIndicator({
  checked,
  checkedColor,
  uncheckedColor,
}: CheckboxIndicatorProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      color={
        checked
          ? (checkedColor ?? colors.primary)
          : (uncheckedColor ?? colors.borderStrong)
      }
      name={checked ? 'checkbox' : 'square-outline'}
      size={22}
    />
  );
}
