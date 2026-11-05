import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';

import { createStyles } from './styles';

type StreakRestoreConfirmModalProps = {
  coinBalance: number;
  isRestoring?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  previousStreak: number;
  restorePrice: number;
};

export function StreakRestoreConfirmModal({
  coinBalance,
  isRestoring = false,
  onClose,
  onConfirm,
  open,
  previousStreak,
  restorePrice,
}: StreakRestoreConfirmModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const canConfirm = coinBalance >= restorePrice && !isRestoring;

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      title={t('streak.restore.title')}
    >
      <View style={styles.content}>
        <View style={[styles.iconCircle]}>
          <Ionicons color={colors.warning} name="refresh" size={26} />
        </View>

        <ThemedText style={[styles.description]}>
          {t('streak.restore.description', { count: previousStreak })}
        </ThemedText>

        <View style={styles.costRow}>
          <View style={styles.balanceItem}>
            <ThemedText style={styles.meta}>
              {t('streak.restore.cost')}
            </ThemedText>
            <View style={styles.coinRow}>
              <Image
                contentFit="contain"
                source={require('../../../../assets/images/money.png')}
                style={styles.moneyIcon}
              />
              <ThemedText type="bodyStrong">{restorePrice}</ThemedText>
            </View>
          </View>
          <View style={styles.balanceItem}>
            <ThemedText style={styles.meta}>
              {t('streak.restore.balance')}
            </ThemedText>
            <View style={styles.coinRow}>
              <Image
                contentFit="contain"
                source={require('../../../../assets/images/money.png')}
                style={styles.moneyIcon}
              />
              <ThemedText type="bodyStrong">{coinBalance}</ThemedText>
            </View>
          </View>
        </View>

        {!canConfirm && !isRestoring ? (
          <ThemedText style={styles.errorText}>
            {t('streak.restore.notEnoughCoins')}
          </ThemedText>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isRestoring}
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <ThemedText type="bodyStrong" style={styles.secondaryText}>
              {t('streak.restore.cancel')}
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
            <Ionicons color={colors.onPrimary} name="refresh" size={18} />
            <ThemedText type="bodyStrong" style={styles.primaryText}>
              {isRestoring
                ? t('streak.restore.restoring')
                : t('streak.restore.confirm')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}
