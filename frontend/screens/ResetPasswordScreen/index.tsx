import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { resetPassword } from '@/api/auth';
import { Button } from '@/components/button';
import { useBanner } from '@/components/banner';
import { PasswordTextInput } from '@/components/passwordTextInput';
import { ScreenContainer } from '@/components/screenContainer';
import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

const minPasswordLength = 8;

function getParamValue(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] ?? '' : param ?? '';
}

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { showBanner } = useBanner();
  const params = useLocalSearchParams<{
    email?: string;
    resetToken?: string;
  }>();
  const email = getParamValue(params.email);
  const resetToken = getParamValue(params.resetToken);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
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

    if (!email || !resetToken) {
      showBanner({
        title: t('auth.errors.resetPasswordInvalidOrExpired'),
        variant: 'error',
      });
      router.replace('/login');
      return;
    }

    try {
      setIsLoading(true);

      const response = await resetPassword({
        email,
        password,
        passwordConfirmation,
        resetToken,
      });

      showBanner({
        title: t('auth.passwordResetSuccess'),
        variant: 'success',
      });
      router.replace({
        pathname: '/login',
        params: {
          email: response.email,
        },
      });
    } catch (error) {
      const messageKey =
        error instanceof Error ? error.message : 'auth.errors.resetPasswordFailed';

      showBanner({
        title: t(messageKey, {
          defaultValue: t('auth.errors.resetPasswordFailed'),
        }),
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
          <ThemedText type="heroTitle">
            {t('auth.resetPasswordTitle')}
          </ThemedText>
          <ThemedText type="paragraph">
            {t('auth.resetPasswordDescription')}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <PasswordTextInput
            label={t('auth.newPasswordLabel')}
            onChangeText={setPassword}
            placeholder={t('auth.newPasswordPlaceholder')}
            textContentType="newPassword"
            value={password}
          />

          <PasswordTextInput
            label={t('auth.confirmNewPasswordLabel')}
            onChangeText={setPasswordConfirmation}
            placeholder={t('auth.confirmNewPasswordPlaceholder')}
            textContentType="newPassword"
            value={passwordConfirmation}
          />

          <Button
            disabled={isLoading}
            style={styles.submitButton}
            onPress={handleResetPassword}
          >
            {isLoading
              ? t('auth.updatingPassword')
              : t('auth.updatePasswordButton')}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}
