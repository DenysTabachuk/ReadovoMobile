import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themedText';

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
      onPress={onPress}>
      <CheckboxIndicator checked={checked} />
      <ThemedText type="body">{label}</ThemedText>
    </Pressable>
  );
}

export function CheckboxIndicator({
  checked,
  checkedColor = '#0a7ea4',
  uncheckedColor = '#6f8f99',
}: CheckboxIndicatorProps) {
  return (
    <Ionicons
      color={checked ? checkedColor : uncheckedColor}
      name={checked ? 'checkbox' : 'square-outline'}
      size={22}
    />
  );
}
