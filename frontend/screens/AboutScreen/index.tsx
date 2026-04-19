import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { styles } from './styles';

export default function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <ThemedText type="heroTitle">{t('about.title')}</ThemedText>
          <ThemedText type="paragraph">{t('about.description')}</ThemedText>
        </View>

        <Image
          source={require('@/assets/images/octopus.png')}
          style={styles.octopusImage}
          contentFit="contain"
        />

        <Pressable style={styles.continueButton} onPress={() => router.push('/login')}>
          <ThemedText type="buttonLabel" style={styles.continueButtonText}>
            {t('about.continue')}
          </ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
