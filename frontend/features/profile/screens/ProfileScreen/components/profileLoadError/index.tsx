import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themedText';
import { createStyles } from './styles';

type ProfileLoadErrorProps = {
  messageKey: string;
  onRetry: () => void;
};

export function ProfileLoadError({
  messageKey,
  onRetry,
}: ProfileLoadErrorProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card]}>
      <ThemedText style={[styles.text]}>{t(messageKey)}</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <ThemedText type="bodyStrong" style={[styles.retryButtonText]}>
          {t('article.retry')}
        </ThemedText>
      </Pressable>
    </View>
  );
}
