import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';

import { createStyles } from './styles';

type StreakFreezeConfirmModalProps = {
  date: string | null;
  freezeTokens: number;
  isApplying?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function StreakFreezeConfirmModal({
  date,
  freezeTokens,
  isApplying = false,
  onClose,
  onConfirm,
  open,
}: StreakFreezeConfirmModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const canConfirm = freezeTokens > 0 && !isApplying;

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      title={t('streak.freeze.modalTitle')}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle]}>
          <Ionicons color={colors.info} name="snow" size={24} />
        </View>
        <ThemedText style={[styles.description]}>
          {t('streak.freeze.modalDescription', { date })}
        </ThemedText>
        <ThemedText style={[styles.tokensText]}>
          {t('streak.freeze.tokensAvailable', { count: freezeTokens })}
        </ThemedText>

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <ThemedText type="bodyStrong" style={styles.secondaryText}>
              {t('streak.freeze.cancel')}
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!canConfirm}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.primaryButton,
              !canConfirm ? styles.primaryButtonDisabled : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <ThemedText type="bodyStrong" style={styles.primaryText}>
              {isApplying
                ? t('streak.freeze.applying')
                : t('streak.freeze.confirm')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}
