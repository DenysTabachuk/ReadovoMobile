import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { registerUser } from '@/api/auth';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { FormTextInput } from '@/components/formTextInput';
import { PasswordTextInput } from '@/components/passwordTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      showBanner({
        title: t('auth.errors.invalidEmail'),
        variant: 'error',
      });
      return;
    }

    if (password.length < minPasswordLength) {
      showBanner({
        title: t('auth.errors.passwordTooShort'),
        variant: 'error',
      });
      return;
    }

    if (password !== passwordConfirmation) {
      showBanner({
        title: t('auth.errors.passwordsDoNotMatch'),
        variant: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);

      await registerUser({
        email: normalizedEmail,
        password,
        passwordConfirmation,
      });

      showBanner({
        title: t('auth.registrationSuccess.title'),
        variant: 'success',
      });
      router.replace('/(tabs)');
    } catch (error) {
      const messageKey = error instanceof Error ? error.message : 'auth.errors.registrationFailed';

      showBanner({
        title: t(messageKey),
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
          <ThemedText type="heroTitle">{t('auth.registerTitle')}</ThemedText>
          <ThemedText type="paragraph">{t('auth.registerDescription')}</ThemedText>
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

          <PasswordTextInput
            label={t('auth.passwordLabel')}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            textContentType="newPassword"
            value={password}
          />

          <PasswordTextInput
            label={t('auth.passwordConfirmationLabel')}
            onChangeText={setPasswordConfirmation}
            placeholder={t('auth.passwordConfirmationPlaceholder')}
            textContentType="newPassword"
            value={passwordConfirmation}
          />

          <Button
            disabled={isLoading}
            style={styles.registerButton}
            onPress={handleRegister}>
            {isLoading ? t('auth.creatingAccount') : t('auth.registerButton')}
          </Button>

          <Pressable
            hitSlop={8}
            style={styles.signInLink}
            onPress={() => router.replace('/login')}>
            <ThemedText type="bodyStrong" style={styles.signInText}>
              {t('auth.haveAccount')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
