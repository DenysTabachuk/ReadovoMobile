import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

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
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canConfirm = freezeTokens > 0 && !isApplying;

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      title={t('streak.freeze.modalTitle')}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, isDark ? styles.iconCircleDark : styles.iconCircleLight]}>
          <Ionicons color="#2d6bc9" name="snow" size={24} />
        </View>
        <ThemedText style={[styles.description, isDark ? styles.descriptionDark : styles.descriptionLight]}>
          {t('streak.freeze.modalDescription', { date })}
        </ThemedText>
        <ThemedText style={[styles.tokensText, isDark ? styles.tokensTextDark : styles.tokensTextLight]}>
          {t('streak.freeze.tokensAvailable', { count: freezeTokens })}
        </ThemedText>

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryButton,
              isDark ? styles.secondaryButtonDark : styles.secondaryButtonLight,
              pressed ? styles.buttonPressed : null,
            ]}>
            <ThemedText type="bodyStrong" style={isDark ? styles.secondaryTextDark : styles.secondaryTextLight}>
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
            ]}>
            <ThemedText type="bodyStrong" style={styles.primaryText}>
              {isApplying ? t('streak.freeze.applying') : t('streak.freeze.confirm')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}
