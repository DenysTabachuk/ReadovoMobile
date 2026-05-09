import { View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { usePreferences } from '@/providers/preferencesProvider';
import { styles } from './styles';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { completeOnboarding } = usePreferences();

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/login');
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <ThemedText type="heroTitle">{t('about.title')}</ThemedText>
          <ThemedText type="paragraph">{t('about.description')}</ThemedText>
        </View>

        <Image
          source={require('../../assets/images/octopus.png')}
          style={styles.octopusImage}
          contentFit="contain"
        />

        <Button style={styles.continueButton} onPress={handleContinue}>
          {t('about.continue')}
        </Button>
      </View>
    </ScreenContainer>
  );
}
