import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ModalSheet } from '@/components/modalSheet';
import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

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
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canConfirm = coinBalance >= restorePrice && !isRestoring;

  return (
    <ModalSheet
      modalProps={{ presentationStyle: 'overFullScreen' }}
      onClose={onClose}
      open={open}
      title={t('streak.restore.title')}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, isDark ? styles.iconCircleDark : styles.iconCircleLight]}>
          <Ionicons color="#d97706" name="refresh" size={26} />
        </View>

        <ThemedText
          style={[
            styles.description,
            isDark ? styles.descriptionDark : styles.descriptionLight,
          ]}>
          {t('streak.restore.description', { count: previousStreak })}
        </ThemedText>

        <View style={styles.costRow}>
          <View style={styles.balanceItem}>
            <ThemedText style={isDark ? styles.metaDark : styles.metaLight}>
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
            <ThemedText style={isDark ? styles.metaDark : styles.metaLight}>
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
              isDark ? styles.secondaryButtonDark : styles.secondaryButtonLight,
              pressed ? styles.buttonPressed : null,
            ]}>
            <ThemedText
              type="bodyStrong"
              style={isDark ? styles.secondaryTextDark : styles.secondaryTextLight}>
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
            ]}>
            <Ionicons color="#ffffff" name="refresh" size={18} />
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
