import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import type { PickerOptionValue } from '../../types';
import { createStyles } from './styles';

type PickerOptionProps<T extends string> = {
  isSelected: boolean;
  onSelect: (value: T) => void;
  option: PickerOptionValue<T>;
};

const STATUS_ICON_SIZE = 16;

export function PickerOption<T extends string>({
  isSelected,
  onSelect,
  option,
}: PickerOptionProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const badgeLabels =
    option.badgeLabels ?? (option.badgeLabel ? [option.badgeLabel] : []);

  return (
    <Pressable
      disabled={option.disabled}
      onPress={option.disabled ? undefined : () => onSelect(option.value)}
      style={[
        styles.optionButton,
        option.disabled ? styles.optionButtonDisabled : null,
        isSelected ? styles.optionButtonSelected : null,
      ]}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionMain}>
          <ThemedText
            style={[
              styles.optionLabel,
              option.disabled ? styles.optionTextDisabled : null,
            ]}
            type="bodyStrong"
          >
            {option.label}
          </ThemedText>
          {option.description ? (
            <ThemedText style={styles.optionDescription} type="description">
              {option.description}
            </ThemedText>
          ) : null}
          {badgeLabels.length > 0 ? (
            <View style={styles.optionBadges}>
              {badgeLabels.map((badgeLabel) => (
                <View key={badgeLabel} style={styles.optionBadge}>
                  <Ionicons
                    color={colors.success}
                    name="checkmark-circle"
                    size={STATUS_ICON_SIZE}
                  />
                  <ThemedText type="description" style={styles.optionBadgeText}>
                    {badgeLabel}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {option.statusIcons?.length ? (
          <View style={styles.statusIcons}>
            {option.statusIcons.map((statusIcon) => (
              <View
                accessibilityLabel={statusIcon.accessibilityLabel}
                key={`${option.value}-${statusIcon.name}-${statusIcon.accessibilityLabel}`}
                style={styles.statusIconBadge}
              >
                <Ionicons
                  color={colors.success}
                  name={statusIcon.name}
                  size={STATUS_ICON_SIZE}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
