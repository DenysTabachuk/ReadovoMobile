import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  requestPasswordReset,
  verifyPasswordResetCode,
} from '@/api/auth';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { FormTextInput } from '@/components/formTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';
import { VerificationCodeModal } from '@/components/verificationCodeModal';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const verificationCodePattern = /^\d{6}$/;

function getParamValue(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] ?? '' : param ?? '';
}

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const iconColor = useThemeColor({}, 'icon');
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(getParamValue(params.email));
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationExpiresAt, setVerificationExpiresAt] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationModalOpen, setIsVerificationModalOpen] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const handleRequestReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      showBanner({
        title: t('auth.errors.invalidEmail'),
        variant: 'error',
      });
      return;
    }

    if (pendingEmail === normalizedEmail) {
      setIsVerificationModalOpen(true);
      return;
    }

    try {
      setIsLoading(true);

      const response = await requestPasswordReset({
        email: normalizedEmail,
      });

      setPendingEmail(response.email);
      setVerificationExpiresAt(response.verificationExpiresAt);
      setVerificationCode('');
      setIsVerificationModalOpen(true);

      showBanner({
        title: t('auth.passwordResetCodeSent'),
        variant: 'success',
      });
    } catch (error) {
      const messageKey =
        error instanceof Error
          ? error.message
          : 'auth.errors.requestPasswordResetFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.requestPasswordResetFailed'),
        }),
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.trim();

    if (!verificationCodePattern.test(code)) {
      showBanner({
        title: t('auth.errors.invalidVerificationCodeFormat'),
        variant: 'error',
      });
      return;
    }

    try {
      setIsVerifyingCode(true);

      const response = await verifyPasswordResetCode({
        code,
        email: pendingEmail,
      });

      setPendingEmail('');
      setVerificationExpiresAt('');
      setVerificationCode('');
      setIsVerificationModalOpen(false);
      router.push({
        pathname: '/reset-password',
        params: {
          email: response.email,
          resetToken: response.resetToken,
        },
      });
    } catch (error) {
      const messageKey =
        error instanceof Error
          ? error.message
          : 'auth.errors.verifyPasswordResetCodeFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.verifyPasswordResetCodeFailed'),
        }),
        variant: 'error',
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsResendingCode(true);

      const response = await requestPasswordReset({
        email: pendingEmail,
      });

      setPendingEmail(response.email);
      setVerificationExpiresAt(response.verificationExpiresAt);
      setVerificationCode('');
      setIsVerificationModalOpen(true);

      showBanner({
        title: t('auth.passwordResetCodeSent'),
        variant: 'success',
      });
    } catch (error) {
      const messageKey =
        error instanceof Error
          ? error.message
          : 'auth.errors.requestPasswordResetFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.requestPasswordResetFailed'),
        }),
        variant: 'error',
      });
    } finally {
      setIsResendingCode(false);
    }
  };

  const isVerificationBusy = isVerifyingCode || isResendingCode;
  const normalizedEmail = email.trim().toLowerCase();
  const hasRequestedCodeForCurrentEmail = pendingEmail === normalizedEmail;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Pressable
          accessibilityLabel={t('auth.backToSignIn')}
          hitSlop={8}
          style={styles.backButton}
          onPress={() => router.replace({ pathname: '/login', params: { email } })}
        >
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </Pressable>

        <View style={styles.textBlock}>
          <ThemedText type="heroTitle">
            {t('auth.forgotPasswordTitle')}
          </ThemedText>
          <ThemedText type="paragraph">
            {t('auth.forgotPasswordDescription')}
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

          <Button
            disabled={isLoading}
            style={styles.submitButton}
            onPress={handleRequestReset}
          >
            {isLoading && !hasRequestedCodeForCurrentEmail
              ? t('auth.sendingPasswordResetCode')
              : hasRequestedCodeForCurrentEmail
                ? t('auth.enterPasswordResetCode')
                : t('auth.sendPasswordResetCode')}
          </Button>

        </View>
      </View>

      <VerificationCodeModal
        code={verificationCode}
        description={t('auth.passwordResetCodeDescription', {
          email: pendingEmail,
        })}
        emailHelpDescription={t('auth.emailHelpDescription')}
        emailHelpTitle={t('auth.emailHelpTitle')}
        isBusy={isVerificationBusy}
        isOpen={isVerificationModalOpen}
        isResending={isResendingCode}
        isVerifying={isVerifyingCode}
        onChangeCode={setVerificationCode}
        onClose={() => {
          if (!isVerificationBusy) {
            setIsVerificationModalOpen(false);
          }
        }}
        onResend={handleResendCode}
        onVerify={handleVerifyCode}
        resendCountdownLabel={(seconds) =>
          t('auth.resendVerificationCodeCountdown', { seconds })
        }
        resendButtonLabel={t('auth.resendVerificationCode')}
        resendingLabel={t('auth.resendingVerificationCode')}
        expirationLabel={t('auth.codeExpirationLabel')}
        expiresAt={verificationExpiresAt}
        title={t('auth.passwordResetCodeTitle')}
        verificationButtonLabel={t('auth.verifyPasswordResetCodeButton')}
        verificationCodeLabel={t('auth.verificationCodeLabel')}
        verificationCodePlaceholder={t('auth.verificationCodePlaceholder')}
        verifyingLabel={t('auth.verifyingPasswordResetCode')}
      />
    </ScreenContainer>
  );
}
