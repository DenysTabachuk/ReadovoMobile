import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { styles } from './styles';
import { formatMetricValue } from './utils/formatMetricValue';

export function MetricComparison({
  adaptedValue,
  decimals = 0,
  label,
  originalValue,
  suffix = '',
}: {
  adaptedValue: number;
  decimals?: number;
  label: string;
  originalValue: number;
  suffix?: string;
}) {
  return (
    <View style={styles.simplificationMetricItem}>
      <ThemedText type="description" style={styles.simplificationMetricLabel}>
        {label}
      </ThemedText>
      <View style={styles.simplificationMetricValues}>
        <ThemedText type="bodyStrong">
          {formatMetricValue(originalValue, decimals, suffix)}
        </ThemedText>
        <Ionicons color="#7c7c7c" name="arrow-forward" size={14} />
        <ThemedText type="bodyStrong">
          {formatMetricValue(adaptedValue, decimals, suffix)}
        </ThemedText>
      </View>
    </View>
  );
}
