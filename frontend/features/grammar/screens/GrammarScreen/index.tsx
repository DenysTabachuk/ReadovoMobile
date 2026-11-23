import { Image } from 'expo-image';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ScrollableScreen } from '@/components/scrollableScreen';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

export default function GrammarScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollableScreen edges={['top']} contentContainerStyle={styles.content}>
      <ThemedText type="heroTitle">{t('learning.grammar.title')}</ThemedText>
      <ThemedText type="description" style={styles.description}>
        {t('learning.grammar.description')}
      </ThemedText>
      <Image
        source={require('../../../../assets/images/learning/grammar.png')}
        contentFit="contain"
        style={styles.illustration}
        accessible={false}
      />
      <ThemedText type="sectionTitle">{t('learning.comingSoon')}</ThemedText>
    </ScrollableScreen>
  );
}
