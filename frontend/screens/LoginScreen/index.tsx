import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const { signInWithGoogle } = await import('@/auth/googleAuth');
      const result = await signInWithGoogle();

      if (!result) {
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('[LoginScreen] Google sign-in flow failed', error);

      const message = error instanceof Error ? error.message : '';
      const isMissingNativeModule = message.includes('RNGoogleSignin');

      setErrorMessage(
        isMissingNativeModule
          ? t('auth.errors.missingNativeModule')
          : message || t('auth.errors.default')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <ThemedText type="heroTitle">{t('auth.title')}</ThemedText>
          <ThemedText type="paragraph">{t('auth.description')}</ThemedText>
        </View>

        {errorMessage ? (
          <ThemedText type="bodyStrong" style={styles.errorText}>
            {errorMessage}
          </ThemedText>
        ) : null}

        <Pressable
          disabled={isLoading}
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignIn}>
          <ThemedText type="buttonLabel" style={styles.googleButtonText}>
            {isLoading ? t('auth.signingIn') : t('auth.googleButton')}
          </ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
