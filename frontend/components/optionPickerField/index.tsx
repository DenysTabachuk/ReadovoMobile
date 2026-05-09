import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type Option<T extends string> = {
  badgeLabel?: string;
  disabled?: boolean;
  displayLabel?: string;
  label: string;
  value: T;
};

type OptionPickerFieldProps<T extends string> = {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  onSelect: (value: T) => void;
  options: Option<T>[];
  selectedValue: T;
  title: string;
};

export function OptionPickerField<T extends string>({
  containerStyle,
  label,
  onSelect,
  options,
  selectedValue,
  title,
}: OptionPickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const chevronProgress = useRef(new Animated.Value(0)).current;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const borderColor = useThemeColor({ dark: '#3a4348', light: '#d0d7de' }, 'icon');
  const selectedBackgroundColor = useThemeColor(
    { dark: '#123847', light: '#e8f5f9' },
    'background',
  );
  const selectedBorderColor = useThemeColor(
    { dark: '#67c6e3', light: '#0a7ea4' },
    'tint',
  );
  const badgeColor = useThemeColor(
    { dark: '#7ee0a0', light: '#1f8a4c' },
    'tint',
  );
  const chevronColor = useThemeColor({ dark: '#9ba1a6', light: '#687076' }, 'icon');

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (value: T) => {
      onSelect(value);
      setOpen(false);
    },
    [onSelect],
  );

  useEffect(() => {
    Animated.timing(chevronProgress, {
      duration: 180,
      toValue: open ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [chevronProgress, open]);

  const chevronAnimatedStyle = {
    transform: [
      {
        rotate: chevronProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  return (
    <>
      <View style={[styles.field, containerStyle]}>
        <ThemedText type="bodyStrong">
          {label}
        </ThemedText>
        <Pressable onPress={handleOpen} style={[styles.pickerButton, { borderColor }]}>
          <ThemedText style={styles.pickerLabel} type="body">
            {selectedOption?.displayLabel ?? selectedOption?.label ?? selectedValue}
          </ThemedText>
          <Animated.View style={chevronAnimatedStyle}>
            <Ionicons color={chevronColor} name="chevron-down" size={18} />
          </Animated.View>
        </Pressable>
      </View>

      <ModalSheet onClose={handleClose} open={open} title={title}>
        <View style={styles.optionsList}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                disabled={option.disabled}
                key={option.value}
                onPress={option.disabled ? undefined : () => handleSelect(option.value)}
                style={[
                  styles.optionButton,
                  { borderColor },
                  option.disabled ? styles.optionButtonDisabled : null,
                  isSelected
                    ? {
                        backgroundColor: selectedBackgroundColor,
                        borderColor: selectedBorderColor,
                      }
                    : null,
                ]}>
                <View style={styles.optionContent}>
                  <ThemedText
                    style={[
                      styles.optionLabel,
                      option.disabled ? styles.optionTextDisabled : null,
                    ]}
                    type="bodyStrong">
                    {option.label}
                  </ThemedText>
                  {option.badgeLabel ? (
                    <View style={styles.optionBadge}>
                      <Ionicons
                        color={badgeColor}
                        name="checkmark-circle"
                        size={16}
                      />
                      <ThemedText
                        type="description"
                        style={[styles.optionBadgeText, { color: badgeColor }]}>
                        {option.badgeLabel}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>
    </>
  );
}
