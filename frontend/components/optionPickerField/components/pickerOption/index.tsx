import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { PickerOptionValue } from '../../types';
import { styles } from './styles';

const STATUS_ICON_SIZE = 16;

type PickerOptionProps<T extends string> = {
  isSelected: boolean;
  onSelect: (value: T) => void;
  option: PickerOptionValue<T>;
};

export function PickerOption<T extends string>({
  isSelected,
  onSelect,
  option,
}: PickerOptionProps<T>) {
  const defaultBorderColor = useThemeColor(
    { dark: '#3a4348', light: '#d0d7de' },
    'icon',
  );
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

  const badgeLabels =
    option.badgeLabels ?? (option.badgeLabel ? [option.badgeLabel] : []);

  return (
    <Pressable
      disabled={option.disabled}
      onPress={option.disabled ? undefined : () => onSelect(option.value)}
      style={[
        styles.optionButton,
        { borderColor: defaultBorderColor },
        option.disabled ? styles.optionButtonDisabled : null,
        isSelected
          ? {
              backgroundColor: selectedBackgroundColor,
              borderColor: selectedBorderColor,
            }
          : null,
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
                <View
                  key={badgeLabel}
                  style={[
                    styles.optionBadge,
                    {
                      backgroundColor: selectedBackgroundColor,
                      borderColor: badgeColor,
                    },
                  ]}
                >
                  <Ionicons
                    color={badgeColor}
                    name="checkmark-circle"
                    size={STATUS_ICON_SIZE}
                  />
                  <ThemedText
                    type="description"
                    style={[styles.optionBadgeText, { color: badgeColor }]}
                  >
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
                style={[
                  styles.statusIconBadge,
                  {
                    backgroundColor: selectedBackgroundColor,
                    borderColor: badgeColor,
                  },
                ]}
              >
                <Ionicons
                  color={badgeColor}
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
