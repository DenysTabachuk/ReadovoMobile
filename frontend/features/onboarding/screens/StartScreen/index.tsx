import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { LanguageSelector } from '@/components/languageSelector';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

export default function StartScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <ThemedText type="heroTitle" style={styles.title}>
            {t('language.title')}
          </ThemedText>
          <ThemedText type="description" style={styles.description}>
            {t('language.description')}
          </ThemedText>
        </View>

        <LanguageSelector style={styles.languageSelector} />

        <Button style={styles.continueButton} onPress={() => router.push('/about')}>
          {t('start.continue')}
        </Button>
      </View>
    </ScreenContainer>
  );
}
