import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { STREAK_FREEZE_TOKEN_PRICE } from '@/features/streak';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type StreakFreezePurchaseModalProps = {
  coinBalance: number;
  isBuying?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function StreakFreezePurchaseModal({
  coinBalance,
  isBuying = false,
  onClose,
  onConfirm,
  open,
}: StreakFreezePurchaseModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canConfirm = coinBalance >= STREAK_FREEZE_TOKEN_PRICE && !isBuying;

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      title={t('streak.freeze.purchaseTitle')}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, isDark ? styles.iconCircleDark : styles.iconCircleLight]}>
          <Ionicons color="#2d6bc9" name="snow" size={24} />
        </View>
        <ThemedText style={[styles.description, isDark ? styles.descriptionDark : styles.descriptionLight]}>
          {t('streak.freeze.purchaseDescription')}
        </ThemedText>
        <View style={styles.priceRow}>
          <Image
            contentFit="contain"
            source={require('../../../../assets/images/money.png')}
            style={styles.moneyIcon}
          />
          <ThemedText type="bodyStrong">
            {STREAK_FREEZE_TOKEN_PRICE}
          </ThemedText>
        </View>

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
              {isBuying ? t('streak.freeze.buying') : t('streak.freeze.purchaseConfirm')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}
