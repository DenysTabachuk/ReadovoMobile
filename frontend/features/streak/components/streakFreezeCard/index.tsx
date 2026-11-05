import { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import { STREAK_MAX_FREEZE_TOKENS } from '../../constants';

import { createStyles } from './styles';

type StreakFreezeCardProps = {
  coinBalance: number;
  freezeTokens: number;
  freezeTokenPrice: number;
  isBuying?: boolean;
  onBuyToken: () => void;
};

export function StreakFreezeCard({
  coinBalance,
  freezeTokens,
  freezeTokenPrice,
  isBuying = false,
  onBuyToken,
}: StreakFreezeCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasEnoughCoins = coinBalance >= freezeTokenPrice;
  const reachedLimit = freezeTokens >= STREAK_MAX_FREEZE_TOKENS;
  const canBuy = hasEnoughCoins && !reachedLimit && !isBuying;
  let buyButtonLabel = t('streak.freeze.buy');
  if (reachedLimit) {
    buyButtonLabel = t('streak.freeze.limitReached');
  } else if (isBuying) {
    buyButtonLabel = t('streak.freeze.buying');
  }

  return (
    <View style={[styles.card]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons color={colors.info} name="snow" size={18} />
          <ThemedText type="bodyStrong" style={styles.title}>
            {t('streak.freeze.title')}
          </ThemedText>
        </View>
        <ThemedText style={[styles.tokenValue]}>
          {freezeTokens}/{STREAK_MAX_FREEZE_TOKENS}
        </ThemedText>
      </View>

      <ThemedText style={[styles.description]}>
        {t('streak.freeze.description')}
      </ThemedText>

      <View style={styles.footerRow}>
        <View style={styles.priceRow}>
          <Image
            contentFit="contain"
            source={require('../../../../assets/images/money.png')}
            style={styles.moneyIcon}
          />
          <ThemedText style={[styles.priceText, styles.description]}>
            {freezeTokenPrice}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!canBuy}
          onPress={onBuyToken}
          style={({ pressed }) => [
            styles.buyButton,
            !canBuy ? styles.buyButtonDisabled : null,
            pressed ? styles.buyButtonPressed : null,
          ]}
        >
          <Ionicons
            color={colors.onInfoSolid}
            name="add-circle-outline"
            size={16}
          />
          <ThemedText type="bodyStrong" style={styles.buyButtonText}>
            {buyButtonLabel}
          </ThemedText>
        </Pressable>
      </View>

      {!hasEnoughCoins && !reachedLimit ? (
        <ThemedText style={styles.warningText}>
          {t('streak.freeze.notEnoughCoins')}
        </ThemedText>
      ) : null}
    </View>
  );
}
