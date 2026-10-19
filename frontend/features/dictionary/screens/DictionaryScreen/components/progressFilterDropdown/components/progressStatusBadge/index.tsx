import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import type { useColorScheme } from '@/hooks/use-color-scheme';
import type { DictionaryWordProgress } from '../../../../../../api/types';
import { getProgressBadgeColors } from '../../../../utils/getProgressBadgeColors';
import { styles } from './styles';

type ProgressStatusBadgeProps = {
  colorScheme: ReturnType<typeof useColorScheme>;
  label: string;
  progress: DictionaryWordProgress;
};

export function ProgressStatusBadge({
  colorScheme,
  label,
  progress,
}: ProgressStatusBadgeProps) {
  const progressColors = getProgressBadgeColors(progress, colorScheme);

  return (
    <View
      style={[
        styles.progressBadge,
        styles.progressFilterBadge,
        { backgroundColor: progressColors.backgroundColor },
      ]}
    >
      <ThemedText
        type="bodyStrong"
        style={[styles.progressText, { color: progressColors.textColor }]}
      >
        {label}
      </ThemedText>
    </View>
  );
}
