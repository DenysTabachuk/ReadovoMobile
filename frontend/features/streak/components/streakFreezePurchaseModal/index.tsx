import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';

import { createStyles } from './styles';

type StreakFreezePurchaseModalProps = {
  coinBalance: number;
  freezeTokenPrice: number;
  isBuying?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function StreakFreezePurchaseModal({
  coinBalance,
  freezeTokenPrice,
  isBuying = false,
  onClose,
  onConfirm,
  open,
}: StreakFreezePurchaseModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const canConfirm = coinBalance >= freezeTokenPrice && !isBuying;

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      title={t('streak.freeze.purchaseTitle')}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle]}>
          <Ionicons color={colors.info} name="snow" size={24} />
        </View>
        <ThemedText style={[styles.description]}>
          {t('streak.freeze.purchaseDescription')}
        </ThemedText>
        <View style={styles.priceRow}>
          <Image
            contentFit="contain"
            source={require('../../../../assets/images/money.png')}
            style={styles.moneyIcon}
          />
          <ThemedText type="bodyStrong">{freezeTokenPrice}</ThemedText>
        </View>

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
              {isBuying
                ? t('streak.freeze.buying')
                : t('streak.freeze.purchaseConfirm')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}
