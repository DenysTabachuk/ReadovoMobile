import { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type ProgressBarProps = {
  value: number;
  total: number;
  accessibilityLabel: string;
  minimum?: number;
  compact?: boolean;
};

const STANDARD_TRACK_HEIGHT = 8;
const COMPACT_TRACK_HEIGHT = 6;

export function ProgressBar({
  value,
  total,
  accessibilityLabel,
  minimum = 0,
  compact = false,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const height = compact ? COMPACT_TRACK_HEIGHT : STANDARD_TRACK_HEIGHT;
  const styles = useMemo(() => createStyles(colors, height), [colors, height]);
  const percent = total > 0 ? (value / total) * 100 : 0;

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: minimum, max: total, now: value }}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}
