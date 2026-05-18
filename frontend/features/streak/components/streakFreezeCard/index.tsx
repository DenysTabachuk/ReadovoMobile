import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themedText';
import {
  STREAK_FREEZE_TOKEN_PRICE,
  STREAK_MAX_FREEZE_TOKENS,
} from '@/features/streak';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type StreakFreezeCardProps = {
  coinBalance: number;
  freezeTokens: number;
  isBuying?: boolean;
  onBuyToken: () => void;
};

export function StreakFreezeCard({
  coinBalance,
  freezeTokens,
  isBuying = false,
  onBuyToken,
}: StreakFreezeCardProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const hasEnoughCoins = coinBalance >= STREAK_FREEZE_TOKEN_PRICE;
  const reachedLimit = freezeTokens >= STREAK_MAX_FREEZE_TOKENS;
  const canBuy = hasEnoughCoins && !reachedLimit && !isBuying;

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons color="#2d6bc9" name="snow" size={18} />
          <ThemedText type="bodyStrong" style={isDark ? styles.titleDark : styles.titleLight}>
            {t('streak.freeze.title')}
          </ThemedText>
        </View>
        <ThemedText style={[styles.tokenValue, isDark ? styles.tokenValueDark : styles.tokenValueLight]}>
          {freezeTokens}/{STREAK_MAX_FREEZE_TOKENS}
        </ThemedText>
      </View>

      <ThemedText style={[styles.description, isDark ? styles.descriptionDark : styles.descriptionLight]}>
        {t('streak.freeze.description')}
      </ThemedText>

      <View style={styles.footerRow}>
        <View style={styles.priceRow}>
          <Image
            contentFit="contain"
            source={require('../../../../assets/images/money.png')}
            style={styles.moneyIcon}
          />
          <ThemedText style={[styles.priceText, isDark ? styles.descriptionDark : styles.descriptionLight]}>
            {STREAK_FREEZE_TOKEN_PRICE}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!canBuy}
          onPress={onBuyToken}
          style={({ pressed }) => [
            styles.buyButton,
            isDark ? styles.buyButtonDark : styles.buyButtonLight,
            !canBuy ? styles.buyButtonDisabled : null,
            pressed ? styles.buyButtonPressed : null,
          ]}>
          <Ionicons color="#ffffff" name="add-circle-outline" size={16} />
          <ThemedText type="bodyStrong" style={styles.buyButtonText}>
            {reachedLimit
              ? t('streak.freeze.limitReached')
              : isBuying
                ? t('streak.freeze.buying')
                : t('streak.freeze.buy')}
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
