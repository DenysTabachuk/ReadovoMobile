import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type SegmentedToggleOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedToggleProps<T extends string> = {
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  selectedValue: T;
};

export function SegmentedToggle<T extends string>({
  onChange,
  options,
  selectedValue,
}: SegmentedToggleProps<T>) {
  const containerColor = useThemeColor(
    { dark: '#1f2326', light: '#f3f4f6' },
    'background',
  );
  const activeOptionColor = '#0a7ea4';
  const activeTextColor = '#ffffff';
  const inactiveTextColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.container, { backgroundColor: containerColor }]}>
      {options.map((option) => {
        const isActive = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              isActive ? { backgroundColor: activeOptionColor } : null,
            ]}>
            <ThemedText
              style={[
                styles.text,
                { color: isActive ? activeTextColor : inactiveTextColor },
              ]}
              type="bodyStrong">
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
