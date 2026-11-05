import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '@/hooks/use-theme';

import { PickerOption } from './components/pickerOption';
import type { PickerOptionValue } from './types';
import { createStyles } from './styles';

type OptionPickerFieldProps<T extends string> = {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  onSelect: (value: T) => void;
  options: PickerOptionValue<T>[];
  selectedValue: T;
  title: string;
};

const CHEVRON_ANIMATION_DURATION_MS = 180;
const CHEVRON_ICON_SIZE = 18;
const CHEVRON_ROTATION_RANGE = ['0deg', '180deg'];

export function OptionPickerField<T extends string>({
  containerStyle,
  label,
  onSelect,
  options,
  selectedValue,
  title,
}: OptionPickerFieldProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const chevronProgress = useRef(new Animated.Value(0)).current;
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

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
      duration: CHEVRON_ANIMATION_DURATION_MS,
      toValue: open ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [chevronProgress, open]);

  const chevronAnimatedStyle = {
    transform: [
      {
        rotate: chevronProgress.interpolate({
          inputRange: [0, 1],
          outputRange: CHEVRON_ROTATION_RANGE,
        }),
      },
    ],
  };

  return (
    <>
      <View style={[styles.field, containerStyle]}>
        <ThemedText type="bodyStrong">{label}</ThemedText>
        <Pressable onPress={handleOpen} style={styles.pickerButton}>
          <ThemedText style={styles.pickerLabel} type="body">
            {selectedOption?.displayLabel ??
              selectedOption?.label ??
              selectedValue}
          </ThemedText>
          <Animated.View style={chevronAnimatedStyle}>
            <Ionicons
              color={colors.textSecondary}
              name="chevron-down"
              size={CHEVRON_ICON_SIZE}
            />
          </Animated.View>
        </Pressable>
      </View>

      <ModalSheet onClose={handleClose} open={open} title={title}>
        <View style={styles.optionsList}>
          {options.map((option) => (
            <PickerOption
              key={option.value}
              isSelected={option.value === selectedValue}
              onSelect={handleSelect}
              option={option}
            />
          ))}
        </View>
      </ModalSheet>
    </>
  );
}
