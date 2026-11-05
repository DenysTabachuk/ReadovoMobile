import { useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type {
  DictionaryProgressFilter,
  ProgressFilterOption,
} from '../../types';
import { ProgressStatusBadge } from './components/progressStatusBadge';
import { createStyles } from './styles';

type ProgressFilterDropdownProps = {
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        <Pressable onPress={onOpen} style={styles.progressFilterButton}>
          {selectedValue === 'all' ? (
            <ThemedText style={styles.progressFilterAllText} type="bodyStrong">
              {selectedOption?.label ?? selectedValue}
            </ThemedText>
          ) : (
            <ProgressStatusBadge
              label={selectedOption?.label ?? selectedValue}
              progress={selectedValue}
            />
          )}
          <Ionicons
            color={colors.textSecondary}
            name="chevron-down"
            size={18}
          />
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
                  isSelected ? styles.progressFilterOptionSelected : null,
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
                    label={option.label}
                    progress={option.value}
                  />
                )}
                {isSelected ? (
                  <Ionicons
                    color={colors.selectionBorder}
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
