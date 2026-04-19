import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { styles } from './styles';

export default function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <ThemedText type="heroTitle">{t('about.title')}</ThemedText>
        <ThemedText type="paragraph">{t('about.description')}</ThemedText>
      </View>
    </ScreenContainer>
  );
}
