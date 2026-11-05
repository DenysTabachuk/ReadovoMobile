import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';

import { createStyles } from './styles';
import type { TimeValue } from './types';
import { createDateFromTime } from './utils/createDateFromTime';
import { formatTime } from './utils/formatTime';

type TimePickerFieldProps = {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  onChange: (time: TimeValue) => void;
  value: TimeValue;
};

const TIME_ICON_SIZE = 20;
const CHEVRON_ICON_SIZE = 18;

export function TimePickerField({
  containerStyle,
  label,
  onChange,
  value,
}: TimePickerFieldProps) {
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const pickerDate = useMemo(() => createDateFromTime(value), [value]);

  const handlePress = () => {
    setPickerVisible(true);
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    onChange(formatTime(selectedDate));
  };

  return (
    <View style={[styles.field, containerStyle]}>
      <ThemedText type="bodyStrong">{label}</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        style={styles.pickerButton}
      >
        <View style={styles.pickerButtonContent}>
          <Ionicons
            color={colors.textSecondary}
            name="time-outline"
            size={TIME_ICON_SIZE}
          />
          <ThemedText style={styles.pickerLabel} type="body">
            {value}
          </ThemedText>
        </View>
        <Ionicons
          color={colors.textSecondary}
          name="chevron-down"
          size={CHEVRON_ICON_SIZE}
        />
      </Pressable>

      {isPickerVisible || Platform.OS === 'ios' ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          themeVariant={theme}
          is24Hour
          mode="time"
          onChange={handleChange}
          value={pickerDate}
        />
      ) : null}
    </View>
  );
}
