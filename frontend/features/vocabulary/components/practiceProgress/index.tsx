import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type PracticeProgressProps = {
  title: string;
  sample: string;
  current: number;
  total: number;
  answered: number;
};

export function PracticeProgress({
  title,
  sample,
  current,
  total,
  answered,
}: PracticeProgressProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      <View style={styles.progressHeading}>
        <ThemedText style={styles.secondary}>{sample}</ThemedText>
        <ThemedText type="bodyStrong">
          {t('vocabulary.cards.position', {
            current,
            total,
          })}
        </ThemedText>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityValue={{
          min: 0,
          max: total,
          now: answered,
        }}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${(answered / total) * 100}%` },
          ]}
        />
      </View>
    </>
  );
}
