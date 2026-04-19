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
        <ThemedText type="heroTitle">{t('about.title')}</ThemedText>
        <ThemedText type="paragraph">{t('about.description')}</ThemedText>
      </View>
    </ThemedView>
  );
}
