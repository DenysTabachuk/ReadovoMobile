import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ImageProps } from 'expo-image';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

type DefaultImageFallbackProps = Pick<ImageProps, 'style'>;

export function DefaultImageFallback({ style }: DefaultImageFallbackProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name="image-not-supported"
        size={48}
        color={colors.textSecondary}
        accessible={false}
      />
      <ThemedText style={styles.label}>{t('image.unavailable')}</ThemedText>
    </View>
  );
}
