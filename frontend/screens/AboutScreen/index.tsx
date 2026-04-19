import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { styles } from './styles';

export default function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {t('about.title')}
        </ThemedText>
        <ThemedText style={styles.description}>{t('about.description')}</ThemedText>
      </View>
    </ThemedView>
  );
}