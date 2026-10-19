import { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import type { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type {
  DictionaryProgressFilter,
  ProgressFilterOption,
} from '../../types';
import { ProgressStatusBadge } from './components/progressStatusBadge';
import { styles } from './styles';

type ProgressFilterDropdownProps = {
  colorScheme: ReturnType<typeof useColorScheme>;
  label: string;
  onClose: () => void;
  onOpen: () => void;
  onSelect: (value: DictionaryProgressFilter) => void;
  open: boolean;
  options: ProgressFilterOption[];
  selectedValue: DictionaryProgressFilter;
  title: string;
};

export function ProgressFilterDropdown({
  colorScheme,
  label,
  onClose,
  onOpen,
  onSelect,
  open,
  options,
  selectedValue,
  title,
}: ProgressFilterDropdownProps) {
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );
  const borderColor = useThemeColor(
    { dark: '#3a4348', light: '#d0d7de' },
    'icon',
  );
  const buttonBackgroundColor = useThemeColor(
    { dark: '#202425', light: '#f5f7fa' },
    'background',
  );
  const optionBackgroundColor = useThemeColor(
    { dark: '#151718', light: '#ffffff' },
    'background',
  );
  const selectedBackgroundColor = useThemeColor(
    { dark: '#123847', light: '#e8f5f9' },
    'background',
  );
  const selectedBorderColor = useThemeColor(
    { dark: '#67c6e3', light: '#0a7ea4' },
    'tint',
  );
  const chevronColor = useThemeColor(
    { dark: '#9ba1a6', light: '#687076' },
    'icon',
  );

  const handleSelect = useCallback(
    (value: DictionaryProgressFilter) => {
      onSelect(value);
      onClose();
    },
    [onClose, onSelect],
  );

  return (
    <>
      <View style={styles.progressFilterField}>
        <ThemedText type="bodyStrong">{label}</ThemedText>
        <Pressable
          onPress={onOpen}
          style={[
            styles.progressFilterButton,
            { backgroundColor: buttonBackgroundColor, borderColor },
          ]}
        >
          {selectedValue === 'all' ? (
            <ThemedText style={styles.progressFilterAllText} type="bodyStrong">
              {selectedOption?.label ?? selectedValue}
            </ThemedText>
          ) : (
            <ProgressStatusBadge
              colorScheme={colorScheme}
              label={selectedOption?.label ?? selectedValue}
              progress={selectedValue}
            />
          )}
          <Ionicons color={chevronColor} name="chevron-down" size={18} />
        </Pressable>
      </View>

      <ModalSheet onClose={onClose} open={open} title={title}>
        <View style={styles.progressFilterOptions}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={[
                  styles.progressFilterOption,
                  { backgroundColor: optionBackgroundColor, borderColor },
                  isSelected
                    ? {
                        backgroundColor: selectedBackgroundColor,
                        borderColor: selectedBorderColor,
                      }
                    : null,
                ]}
              >
                {option.value === 'all' ? (
                  <ThemedText
                    style={styles.progressFilterAllText}
                    type="bodyStrong"
                  >
                    {option.label}
                  </ThemedText>
                ) : (
                  <ProgressStatusBadge
                    colorScheme={colorScheme}
                    label={option.label}
                    progress={option.value}
                  />
                )}
                {isSelected ? (
                  <Ionicons
                    color={selectedBorderColor}
                    name="checkmark-circle"
                    size={20}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>
    </>
  );
}
