import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import type { DictionaryWordProgress } from '../../../../../../api/types';
import { createStyles } from './styles';

type ProgressStatusBadgeProps = {
  label: string;
  progress: DictionaryWordProgress;
};

export function ProgressStatusBadge({
  label,
  progress,
}: ProgressStatusBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, progress),
    [colors, progress],
  );

  return (
    <View style={[styles.progressBadge, styles.progressFilterBadge]}>
      <ThemedText type="bodyStrong" style={styles.progressText}>
        {label}
      </ThemedText>
    </View>
  );
}
