import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { styles } from './styles';

type ProfileLoadErrorProps = {
  messageKey: string;
  onRetry: () => void;
};

export function ProfileLoadError({
  messageKey,
  onRetry,
}: ProfileLoadErrorProps) {
  const { t } = useTranslation();
  const isDarkTheme = useColorScheme() === 'dark';
  return (
    <View style={[styles.card, isDarkTheme ? styles.cardDark : null]}>
      <ThemedText style={[styles.text, isDarkTheme ? styles.textDark : null]}>
        {t(messageKey)}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          isDarkTheme ? styles.retryButtonDark : null,
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <ThemedText
          type="bodyStrong"
          style={[
            styles.retryButtonText,
            isDarkTheme ? styles.retryButtonTextDark : null,
          ]}
        >
          {t('article.retry')}
        </ThemedText>
      </Pressable>
    </View>
  );
}
