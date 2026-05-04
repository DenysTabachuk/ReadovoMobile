import { Pressable, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

type CheckboxRowProps = {
  checked: boolean;
  label: string;
  onPress: PressableProps['onPress'];
};

export function CheckboxRow({ checked, label, onPress }: CheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      style={styles.root}
      onPress={onPress}>
      <Ionicons
        color={checked ? '#3357d8' : '#8b8f94'}
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
      />
      <ThemedText type="body">{label}</ThemedText>
    </Pressable>
  );
}
