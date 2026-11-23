import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from './styles';

export function WikipediaArticlesCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('articles.title')}
      onPress={() => router.push('/(tabs)/(learning)/articles')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons
          name="globe-outline"
          size={24}
          color={colors.onSelection}
          accessible={false}
        />
      </View>
      <View style={styles.copy}>
        <ThemedText type="bodyStrong">{t('articles.title')}</ThemedText>
        <ThemedText style={styles.description}>
          {t('learning.reading.catalogueDescription')}
        </ThemedText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={22}
        color={colors.interactive}
        accessible={false}
      />
    </Pressable>
  );
}
