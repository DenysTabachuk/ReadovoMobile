import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ProgressBar } from '@/components/progressBar';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type PracticeProgressProps = {
  title: string;
  subtitle: string;
  current: number;
  total: number;
  answered: number;
};

export function PracticeProgress({
  title,
  subtitle,
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
        <ThemedText style={styles.secondary}>{subtitle}</ThemedText>
        <ThemedText type="bodyStrong">
          {t('vocabulary.cards.position', {
            current,
            total,
          })}
        </ThemedText>
      </View>
      <ProgressBar accessibilityLabel={title} total={total} value={answered} />
    </>
  );
}
