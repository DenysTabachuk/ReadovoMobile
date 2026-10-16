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

import { styles } from './styles';
import type { TimeValue } from './types';
import { createDateFromTime } from './utils/createDateFromTime';
import { formatTime } from './utils/formatTime';

const TIME_ICON_SIZE = 20;
const CHEVRON_ICON_SIZE = 18;

type TimePickerFieldProps = {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  onChange: (time: TimeValue) => void;
  value: TimeValue;
};

export function TimePickerField({
  containerStyle,
  label,
  onChange,
  value,
}: TimePickerFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const pickerDate = useMemo(() => createDateFromTime(value), [value]);
  const borderColor = useThemeColor(
    { dark: '#3a4348', light: '#d0d7de' },
    'icon',
  );
  const buttonBackgroundColor = useThemeColor(
    { dark: '#202425', light: '#f5f7fa' },
    'background',
  );
  const iconColor = useThemeColor(
    { dark: '#9ba1a6', light: '#687076' },
    'icon',
  );

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
        style={[
          styles.pickerButton,
          { backgroundColor: buttonBackgroundColor, borderColor },
        ]}
      >
        <View style={styles.pickerButtonContent}>
          <Ionicons
            color={iconColor}
            name="time-outline"
            size={TIME_ICON_SIZE}
          />
          <ThemedText style={styles.pickerLabel} type="body">
            {value}
          </ThemedText>
        </View>
        <Ionicons
          color={iconColor}
          name="chevron-down"
          size={CHEVRON_ICON_SIZE}
        />
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
