import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';

import { createStyles } from './styles';

type SegmentedToggleOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedToggleProps<T extends string> = {
  disabled?: boolean;
  onChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  selectedValue: T;
};

export function SegmentedToggle<T extends string>({
  disabled = false,
  onChange,
  options,
  selectedValue,
}: SegmentedToggleProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = option.value === selectedValue;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive, disabled }}
            disabled={disabled}
            key={option.value}
            onPress={disabled ? undefined : () => onChange(option.value)}
            style={[
              styles.option,
              isActive ? styles.activeOption : null,
              disabled ? styles.disabledOption : null,
            ]}
          >
            <ThemedText
              style={[
                styles.text,
                isActive ? styles.activeText : styles.inactiveText,
              ]}
              type="bodyStrong"
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
