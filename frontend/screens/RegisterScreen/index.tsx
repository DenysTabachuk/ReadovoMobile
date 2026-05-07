import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { registerUser, resendVerificationCode, verifyEmail } from '@/api/auth';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { FormTextInput } from '@/components/formTextInput';
import { ModalSheet } from '@/components/modalSheet';
import { PasswordTextInput } from '@/components/passwordTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;
const verificationCodePattern = /^\d{6}$/;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

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

      const response = await registerUser({
        email: normalizedEmail,
        password,
        passwordConfirmation,
      });

      setPendingEmail(response.email);
      setVerificationCode('');

      showBanner({
        title: t('auth.verificationCodeSent'),
        variant: 'success',
      });
    } catch (error) {
      const messageKey =
        error instanceof Error
          ? error.message
          : 'auth.errors.registrationFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.registrationFailed'),
        }),
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const code = verificationCode.trim();

    if (!verificationCodePattern.test(code)) {
      showBanner({
        title: t('auth.errors.invalidVerificationCodeFormat'),
        variant: 'error',
      });
      return;
    }

    try {
      setIsVerifyingEmail(true);

      await verifyEmail({
        code,
        email: pendingEmail,
      });

      showBanner({
        title: t('auth.registrationSuccess.title'),
        variant: 'success',
      });
      setPendingEmail('');
      setVerificationCode('');
      router.replace('/login');
    } catch (error) {
      const messageKey =
        error instanceof Error
          ? error.message
          : 'auth.errors.emailVerificationFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.emailVerificationFailed'),
        }),
        variant: 'error',
      });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResendingCode(true);

      const response = await resendVerificationCode({
        email: pendingEmail,
      });

      setPendingEmail(response.email);
      setVerificationCode('');

      showBanner({
        title: t('auth.verificationCodeSent'),
        variant: 'success',
      });
    } catch (error) {
      const messageKey =
        error instanceof Error
          ? error.message
          : 'auth.errors.resendVerificationCodeFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.resendVerificationCodeFailed'),
        }),
        variant: 'error',
      });
    } finally {
      setIsResendingCode(false);
    }
  };

  const isVerificationModalOpen = pendingEmail.length > 0;
  const isVerificationBusy = isVerifyingEmail || isResendingCode;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <ThemedText type="heroTitle">{t('auth.registerTitle')}</ThemedText>
          <ThemedText type="paragraph">
            {t('auth.registerDescription')}
          </ThemedText>
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
            onPress={handleRegister}
          >
            {isLoading ? t('auth.creatingAccount') : t('auth.registerButton')}
          </Button>

          <Pressable
            hitSlop={8}
            style={styles.signInLink}
            onPress={() => router.replace('/login')}
          >
            <ThemedText type="bodyStrong" style={styles.signInText}>
              {t('auth.haveAccount')}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <ModalSheet
        modalProps={{ presentationStyle: 'overFullScreen' }}
        onClose={() => {
          if (!isVerificationBusy) {
            setPendingEmail('');
            setVerificationCode('');
          }
        }}
        open={isVerificationModalOpen}
        title={t('auth.verifyEmailTitle')}
      >
        <View style={styles.verificationContent}>
          <ThemedText type="paragraph">
            {t('auth.verifyEmailDescription', { email: pendingEmail })}
          </ThemedText>

          <FormTextInput
            autoCapitalize="none"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            label={t('auth.verificationCodeLabel')}
            maxLength={6}
            onChangeText={setVerificationCode}
            placeholder={t('auth.verificationCodePlaceholder')}
            textContentType="oneTimeCode"
            value={verificationCode}
          />

          <Button disabled={isVerificationBusy} onPress={handleVerifyEmail}>
            {isVerifyingEmail
              ? t('auth.verifyingEmail')
              : t('auth.verifyEmailButton')}
          </Button>

          <Button
            disabled={isVerificationBusy}
            onPress={handleResendCode}
            variant="secondary"
          >
            {isResendingCode
              ? t('auth.resendingVerificationCode')
              : t('auth.resendVerificationCode')}
          </Button>
        </View>
      </ModalSheet>
    </ScreenContainer>
  );
}
