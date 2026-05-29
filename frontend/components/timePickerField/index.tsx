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
import { useThemeColor } from '@/hooks/use-theme-color';
import type { LearningReminderTime } from '@/providers/preferencesProvider';

import { styles } from './styles';

type TimePickerFieldProps = {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  onChange: (time: LearningReminderTime) => void;
  value: LearningReminderTime;
};

function createDateFromTime(time: LearningReminderTime): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date;
}

function formatTime(date: Date): LearningReminderTime {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}` as LearningReminderTime;
}

export function TimePickerField({
  containerStyle,
  label,
  onChange,
  value,
}: TimePickerFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const pickerDate = useMemo(() => createDateFromTime(value), [value]);
  const borderColor = useThemeColor({ dark: '#3a4348', light: '#d0d7de' }, 'icon');
  const buttonBackgroundColor = useThemeColor(
    { dark: '#202425', light: '#f5f7fa' },
    'background',
  );
  const iconColor = useThemeColor({ dark: '#9ba1a6', light: '#687076' }, 'icon');

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
        style={[styles.pickerButton, { backgroundColor: buttonBackgroundColor, borderColor }]}>
        <View style={styles.pickerButtonContent}>
          <Ionicons color={iconColor} name="time-outline" size={20} />
          <ThemedText style={styles.pickerLabel} type="body">
            {value}
          </ThemedText>
        </View>
        <Ionicons color={iconColor} name="chevron-down" size={18} />
      </Pressable>

      {isPickerVisible || Platform.OS === 'ios' ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          is24Hour
          mode="time"
          onChange={handleChange}
          value={pickerDate}
        />
      ) : null}
    </View>
  );
}
