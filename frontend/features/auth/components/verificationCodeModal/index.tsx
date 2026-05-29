import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/components/button';
import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

const verificationCodeLength = 6;
const resendCooldownMs = 60_000;

type VerificationCodeModalProps = {
  code: string;
  description: string;
  emailHelpDescription?: string;
  emailHelpTitle?: string;
  expiresAt?: string;
  expirationLabel?: string;
  isBusy: boolean;
  isOpen: boolean;
  isResending: boolean;
  isVerifying: boolean;
  onChangeCode: (code: string) => void;
  onClose: () => void;
  onResend: () => void;
  onVerify: () => void;
  resendCountdownLabel: (seconds: number) => string;
  resendButtonLabel: string;
  resendingLabel: string;
  title: string;
  verificationButtonLabel: string;
  verificationCodeLabel: string;
  verificationCodePlaceholder: string;
  verifyingLabel: string;
};

export function VerificationCodeModal({
  code,
  description,
  emailHelpDescription,
  emailHelpTitle,
  expiresAt,
  expirationLabel,
  isBusy,
  isOpen,
  isResending,
  isVerifying,
  onChangeCode,
  onClose,
  onResend,
  onVerify,
  resendCountdownLabel,
  resendButtonLabel,
  resendingLabel,
  title,
  verificationButtonLabel,
  verificationCodeLabel,
  verificationCodePlaceholder,
  verifyingLabel,
}: VerificationCodeModalProps) {
  const inputRef = useRef<TextInput>(null);
  const borderColor = useThemeColor({ dark: '#7d8790', light: '#c8ccd6' }, 'icon');
  const cellBackgroundColor = useThemeColor(
    { dark: '#202426', light: '#ffffff' },
    'background',
  );
  const placeholderColor = useThemeColor(
    { dark: '#a5adb6', light: '#c8ccd6' },
    'icon',
  );
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const resendIconColor = useThemeColor(
    { dark: '#9aa7ff', light: '#0a7ea4' },
    'tint',
  );
  const helpBlockBackgroundColor = useThemeColor(
    { dark: '#202039', light: '#f2efff' },
    'background',
  );
  const helpIconBackgroundColor = useThemeColor(
    { dark: '#292951', light: '#e5ddff' },
    'background',
  );
  const codeDigits = useMemo(
    () => Array.from({ length: verificationCodeLength }, (_, index) => code[index] ?? ''),
    [code],
  );
  const activeCellIndex = Math.min(code.length, verificationCodeLength - 1);
  const [now, setNow] = useState(() => Date.now());
  const [resendAvailableAtMs, setResendAvailableAtMs] = useState(0);

  useEffect(() => {
    if (!isOpen || !expiresAt) {
      return;
    }

    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isOpen]);

  useEffect(() => {
    if (!expiresAt) {
      setResendAvailableAtMs(0);
      return;
    }

    setResendAvailableAtMs(Date.now() + resendCooldownMs);
  }, [expiresAt]);

  const expirationTimeLeft = useMemo(() => {
    if (!expiresAt) {
      return null;
    }

    const expiresAtMs = new Date(expiresAt).getTime();

    if (Number.isNaN(expiresAtMs)) {
      return null;
    }

    return Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
  }, [expiresAt, now]);

  const formattedExpirationTime = useMemo(() => {
    if (expirationTimeLeft === null) {
      return null;
    }

    const minutes = Math.floor(expirationTimeLeft / 60);
    const seconds = expirationTimeLeft % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [expirationTimeLeft]);
  const resendSecondsLeft = Math.max(
    0,
    Math.ceil((resendAvailableAtMs - now) / 1000),
  );
  const isResendDisabled = isBusy || resendSecondsLeft > 0;

  const focusCodeInput = () => {
    inputRef.current?.focus();
  };

  const handleChangeCode = (nextCode: string) => {
    onChangeCode(nextCode.replace(/\D/g, '').slice(0, verificationCodeLength));
  };

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={isOpen}
      title={title}
    >
      <View style={styles.content}>
        <ThemedText type="paragraph">{description}</ThemedText>

        <Pressable
          accessibilityLabel={verificationCodeLabel}
          accessibilityHint={verificationCodePlaceholder}
          disabled={isBusy}
          onPress={focusCodeInput}
          style={styles.codeInputContainer}
        >
          <TextInput
            ref={inputRef}
            autoCapitalize="none"
            autoComplete="one-time-code"
            caretHidden
            editable={!isBusy}
            keyboardType="number-pad"
            maxLength={verificationCodeLength}
            onChangeText={handleChangeCode}
            selectionColor={tintColor}
            style={styles.hiddenInput}
            textContentType="oneTimeCode"
            value={code}
          />

          <View style={styles.codeCells}>
            {codeDigits.map((digit, index) => {
              const isActive = index === activeCellIndex && code.length < verificationCodeLength;

              return (
                <View
                  key={index}
                  style={[
                    styles.codeCell,
                    { backgroundColor: cellBackgroundColor, borderColor },
                    isActive ? [styles.codeCellActive, { borderColor: tintColor }] : null,
                  ]}
                >
                  <ThemedText
                    type="sectionTitle"
                    style={[
                      styles.codeCellText,
                      { color: digit ? textColor : placeholderColor },
                    ]}
                  >
                    {digit || '-'}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </Pressable>

        {expirationLabel && formattedExpirationTime ? (
          <ThemedText type="paragraph" style={styles.expirationText}>
            {expirationLabel}{' '}
            <ThemedText type="bodyStrong" style={{ color: tintColor }}>
              {formattedExpirationTime}
            </ThemedText>
          </ThemedText>
        ) : null}

        {emailHelpTitle && emailHelpDescription ? (
          <View
            style={[
              styles.emailHelpBlock,
              { backgroundColor: helpBlockBackgroundColor },
            ]}
          >
            <View
              style={[
                styles.emailHelpIcon,
                { backgroundColor: helpIconBackgroundColor },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={28}
                color={tintColor}
              />
            </View>

            <View style={styles.emailHelpTextBlock}>
              <ThemedText type="bodyStrong">{emailHelpTitle}</ThemedText>
              <ThemedText type="default" style={styles.emailHelpDescription}>
                {emailHelpDescription}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <Button disabled={isBusy} onPress={onVerify}>
          {isVerifying ? verifyingLabel : verificationButtonLabel}
        </Button>

        <Button
          disabled={isResendDisabled}
          leftAccessory={
            <MaterialCommunityIcons
              name="timer-refresh-outline"
              size={24}
              color={resendIconColor}
            />
          }
          onPress={onResend}
          variant="secondary"
        >
          {isResending
            ? resendingLabel
            : resendSecondsLeft > 0
              ? resendCountdownLabel(resendSecondsLeft)
              : resendButtonLabel}
        </Button>
      </View>
    </ModalSheet>
  );
}
