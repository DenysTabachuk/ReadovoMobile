import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type Option<T extends string> = {
  label: string;
  value: T;
};

type OptionPickerFieldProps<T extends string> = {
  label: string;
  onSelect: (value: T) => void;
  options: Option<T>[];
  selectedValue: T;
  title: string;
};

export function OptionPickerField<T extends string>({
  label,
  onSelect,
  options,
  selectedValue,
  title,
}: OptionPickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      <View style={styles.field}>
        <ThemedText type="bodyStrong">{label}</ThemedText>
        <Pressable onPress={handleOpen} style={[styles.pickerButton, { borderColor }]}>
          <ThemedText type="body">{selectedOption?.label ?? selectedValue}</ThemedText>
        </Pressable>
      </View>

      <ModalSheet onClose={handleClose} open={open} title={title}>
        <View style={styles.optionsList}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={[
                  styles.optionButton,
                  { borderColor },
                  isSelected
                    ? {
                        backgroundColor: selectedBackgroundColor,
                        borderColor: selectedBorderColor,
                      }
                    : null,
                ]}>
                <ThemedText type="bodyStrong">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>
    </>
  );
}
