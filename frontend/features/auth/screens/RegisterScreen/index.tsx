import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { registerUser, resendVerificationCode, verifyEmail } from '@/api/auth';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { FormTextInput } from '@/components/formTextInput';
import { PasswordTextInput } from '@/features/auth/components/passwordTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { VerificationCodeModal } from '@/features/auth/components/verificationCodeModal';

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
  const [verificationExpiresAt, setVerificationExpiresAt] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const emailError =
    !emailPattern.test(normalizedEmail) ? t('auth.errors.invalidEmail') : '';
  const passwordError =
    password.length < minPasswordLength
      ? t('auth.errors.passwordTooShort')
      : '';
  const passwordConfirmationError =
    password !== passwordConfirmation
      ? t('auth.errors.passwordsDoNotMatch')
      : '';
  const shouldShowEmailError = isSubmitted && emailError.length > 0;
  const shouldShowPasswordError = isSubmitted && passwordError.length > 0;
  const shouldShowPasswordConfirmationError =
    isSubmitted && passwordConfirmationError.length > 0;

  const handleRegister = async () => {
    setIsSubmitted(true);

    if (
      emailError.length > 0 ||
      passwordError.length > 0 ||
      passwordConfirmationError.length > 0
    ) {
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
      setVerificationExpiresAt(response.verificationExpiresAt);
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
      setVerificationExpiresAt('');
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
      setVerificationExpiresAt(response.verificationExpiresAt);
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
            errorText={shouldShowEmailError ? emailError : undefined}
            hasError={shouldShowEmailError}
            keyboardType="email-address"
            label={t('auth.emailLabel')}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            textContentType="emailAddress"
            value={email}
          />

          <PasswordTextInput
            errorText={shouldShowPasswordError ? passwordError : undefined}
            hasError={shouldShowPasswordError}
            label={t('auth.passwordLabel')}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPlaceholder')}
            textContentType="newPassword"
            value={password}
          />

          <PasswordTextInput
            errorText={
              shouldShowPasswordConfirmationError
                ? passwordConfirmationError
                : undefined
            }
            hasError={shouldShowPasswordConfirmationError}
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

      <VerificationCodeModal
        code={verificationCode}
        description={t('auth.verifyEmailDescription', { email: pendingEmail })}
        emailHelpDescription={t('auth.emailHelpDescription')}
        emailHelpTitle={t('auth.emailHelpTitle')}
        isBusy={isVerificationBusy}
        isOpen={isVerificationModalOpen}
        isResending={isResendingCode}
        isVerifying={isVerifyingEmail}
        onChangeCode={setVerificationCode}
        onClose={() => {
          if (!isVerificationBusy) {
            setPendingEmail('');
            setVerificationExpiresAt('');
            setVerificationCode('');
          }
        }}
        onResend={handleResendCode}
        onVerify={handleVerifyEmail}
        resendCountdownLabel={(seconds) =>
          t('auth.resendVerificationCodeCountdown', { seconds })
        }
        resendButtonLabel={t('auth.resendVerificationCode')}
        resendingLabel={t('auth.resendingVerificationCode')}
        expirationLabel={t('auth.codeExpirationLabel')}
        expiresAt={verificationExpiresAt}
        title={t('auth.verifyEmailTitle')}
        verificationButtonLabel={t('auth.verifyEmailButton')}
        verificationCodeLabel={t('auth.verificationCodeLabel')}
        verificationCodePlaceholder={t('auth.verificationCodePlaceholder')}
        verifyingLabel={t('auth.verifyingEmail')}
      />
    </ScreenContainer>
  );
}
