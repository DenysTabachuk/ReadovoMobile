import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { loginUser } from '@/api/auth';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { CheckboxRow } from '@/components/checkboxRow';
import { FormTextInput } from '@/components/formTextInput';
import { PasswordTextInput } from '@/components/passwordTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { useAuth } from '@/providers/authProvider';

import { styles } from './styles';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getParamValue(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] ?? '' : param ?? '';
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const { rememberMePreference, setRememberMePreference, signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(getParamValue(params.email));
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(rememberMePreference);

  useEffect(() => {
    setRememberMe(rememberMePreference);
  }, [rememberMePreference]);

  const handleSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      showBanner({
        title: t('auth.errors.invalidEmail'),
        variant: 'error',
      });
      return;
    }

    if (password.length === 0) {
      showBanner({
        title: t('auth.errors.passwordRequired'),
        variant: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await loginUser({
        email: normalizedEmail,
        password,
      });
      await signIn(rememberMe, {
        displayName: null,
        email: response.user.email,
        id: response.user.id,
      });

      showBanner({
        title: t('auth.success.title'),
        variant: 'success',
      });
      router.replace('/(tabs)');
    } catch (error) {
      const messageKey =
        error instanceof Error ? error.message : 'auth.errors.loginFailed';

      showBanner({
        title: t(messageKey, { defaultValue: t('auth.errors.loginFailed') }),
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      const { signInWithGoogle } = await import('@/auth/googleAuth');
      const result = await signInWithGoogle();

      if (!result) {
        return;
      }
      await signIn(rememberMe, {
        displayName: result.user.name ?? null,
        email: result.user.email ?? null,
        id: null,
      });

      showBanner({
        title: t('auth.success.title'),
        variant: 'success',
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[LoginScreen] Google sign-in flow failed', error);
      const messageKey =
        error instanceof Error ? error.message : 'auth.errors.default';

      showBanner({
        title: t(messageKey, { defaultValue: t('auth.errors.default') }),
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

          <PasswordTextInput
            label={t('auth.passwordLabel')}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            textContentType="password"
            value={password}
          />

          <CheckboxRow
            checked={rememberMe}
            label={t('auth.rememberMe')}
            onPress={async () => {
              const nextValue = !rememberMe;
              setRememberMe(nextValue);
              await setRememberMePreference(nextValue);
            }}
          />

          <Pressable
            hitSlop={8}
            style={styles.forgotPasswordButton}
            onPress={() =>
              router.push({
                pathname: '/forgot-password',
                params: {
                  email: email.trim().toLowerCase(),
                },
              })
            }
          >
            <ThemedText type="bodyStrong" style={styles.forgotPasswordText}>
              {t('auth.forgotPassword')}
            </ThemedText>
          </Pressable>

          <Button
            disabled={isLoading}
            style={styles.signInButton}
            onPress={handleSignIn}
          >
            {isLoading ? t('auth.signingIn') : t('auth.signInButton')}
          </Button>

          <ThemedText type="bodyStrong" style={styles.orText}>
            {t('auth.orDivider')}
          </ThemedText>
        </View>

        <Pressable
          disabled={isLoading}
          style={[
            styles.googleButton,
            isLoading && styles.googleButtonDisabled,
          ]}
          onPress={handleGoogleSignIn}
        >
          <Ionicons name="logo-google" size={32} color="#4285F4" />
          <ThemedText type="buttonLabel" style={styles.googleButtonText}>
            {isLoading ? t('auth.signingIn') : t('auth.googleButton')}
          </ThemedText>
        </Pressable>

        <Pressable
          hitSlop={8}
          style={styles.createAccountButton}
          onPress={() => router.push('/register')}
        >
          <ThemedText type="bodyStrong" style={styles.createAccountText}>
            {t('auth.createAccount')}
          </ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
