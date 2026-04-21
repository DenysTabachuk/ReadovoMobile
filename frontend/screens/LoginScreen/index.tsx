import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { FormTextInput } from '@/components/formTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const inputIconColor = useThemeColor({}, 'text');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSignIn = () => {
    showBanner({
      title: t('auth.success.title'),
      variant: 'success',
    });
    router.replace('/(tabs)');
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      const { signInWithGoogle } = await import('@/auth/googleAuth');
      const result = await signInWithGoogle();

      if (!result) {
        return;
      }

      showBanner({
        title: t('auth.success.title'),
        variant: 'success',
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[LoginScreen] Google sign-in flow failed', error);

      showBanner({
        title: t('auth.errors.title'),
        variant: 'error',
      });
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

        <View style={styles.form}>
          <FormTextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label={t('auth.emailLabel')}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            textContentType="emailAddress"
            value={email}
          />

          <FormTextInput
            autoCapitalize="none"
            autoComplete="password"
            label={t('auth.passwordLabel')}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            rightAccessory={
              <Pressable
                accessibilityLabel={t('auth.togglePasswordVisibility')}
                hitSlop={12}
                onPress={() => setIsPasswordVisible((current) => !current)}>
                <Ionicons
                  color={inputIconColor}
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                />
              </Pressable>
            }
            secureTextEntry={!isPasswordVisible}
            textContentType="password"
            value={password}
          />

          <Pressable hitSlop={8} style={styles.forgotPasswordButton}>
            <ThemedText type="bodyStrong" style={styles.forgotPasswordText}>
              {t('auth.forgotPassword')}
            </ThemedText>
          </Pressable>

          <Button style={styles.signInButton} onPress={handleSignIn}>
            {t('auth.signInButton')}
          </Button>

          <ThemedText type="bodyStrong" style={styles.orText}>
            {t('auth.orDivider')}
          </ThemedText>
        </View>

        <Pressable
          disabled={isLoading}
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleGoogleSignIn}>
          <Ionicons name="logo-google" size={32} color="#4285F4" />
          <ThemedText type="buttonLabel" style={styles.googleButtonText}>
            {isLoading ? t('auth.signingIn') : t('auth.googleButton')}
          </ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
