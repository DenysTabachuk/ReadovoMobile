import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Animated, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Banner } from './banner';
import {
  ANIMATION_DURATION_MS,
  DEFAULT_DURATION_MS,
  HIDDEN_OFFSET,
} from './constants';
import { BannerContext } from './context';
import { type ShowBannerOptions } from './types';
import { ThemedText } from '@/components/themedText';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { styles } from './styles';

type BannerProviderProps = {
  children: ReactNode;
};

export function BannerProvider({ children }: BannerProviderProps) {
  const [banner, setBanner] = useState<ShowBannerOptions | null>(null);
  const [queueSignal, setQueueSignal] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const queueRef = useRef<ShowBannerOptions[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeBannerIdRef = useRef<number | null>(null);
  const isHidingRef = useRef(false);
  const bannerIdSequenceRef = useRef(0);

  const clearHideTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideBannerById = useCallback((bannerId?: number) => {
    if (
      bannerId !== undefined &&
      activeBannerIdRef.current !== null &&
      activeBannerIdRef.current !== bannerId
    ) {
      return;
    }

    if (isHidingRef.current || activeBannerIdRef.current === null) {
      return;
    }

    const hidingBannerId = activeBannerIdRef.current;
    isHidingRef.current = true;
    clearHideTimer();
    opacity.stopAnimation();
    translateY.stopAnimation();

    Animated.parallel([
      Animated.timing(opacity, {
        duration: ANIMATION_DURATION_MS,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: ANIMATION_DURATION_MS,
        toValue: HIDDEN_OFFSET,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && activeBannerIdRef.current === hidingBannerId) {
        activeBannerIdRef.current = null;
      }
      isHidingRef.current = false;
      setBanner(null);
      setQueueSignal((currentSignal) => currentSignal + 1);
    });
  }, [clearHideTimer, opacity, translateY]);

  const hideBanner = useCallback(() => {
    hideBannerById();
  }, [hideBannerById]);

  useEffect(() => {
    if (banner || isHidingRef.current || queueRef.current.length === 0) {
      return;
    }

    const nextBanner = queueRef.current.shift();

    if (!nextBanner) {
      return;
    }

    const bannerId = bannerIdSequenceRef.current + 1;
    bannerIdSequenceRef.current = bannerId;
    activeBannerIdRef.current = bannerId;
    setBanner(nextBanner);

    clearHideTimer();
    opacity.stopAnimation();
    translateY.stopAnimation();
    opacity.setValue(0);
    translateY.setValue(HIDDEN_OFFSET);

    Animated.parallel([
      Animated.timing(opacity, {
        duration: ANIMATION_DURATION_MS,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        damping: 18,
        mass: 0.8,
        stiffness: 180,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    if (nextBanner.durationMs && nextBanner.durationMs > 0) {
      timerRef.current = setTimeout(() => {
        hideBannerById(bannerId);
      }, nextBanner.durationMs);
    }
  }, [banner, clearHideTimer, hideBannerById, opacity, queueSignal, translateY]);

  const showBanner = useCallback(
    ({ durationMs = DEFAULT_DURATION_MS, ...options }: ShowBannerOptions) => {
      queueRef.current.push({
        ...options,
        durationMs,
      });
      setQueueSignal((currentSignal) => currentSignal + 1);
    },
    []
  );

  useEffect(
    () => () => {
      clearHideTimer();
      queueRef.current = [];
      activeBannerIdRef.current = null;
      isHidingRef.current = false;
    },
    [clearHideTimer],
  );

  const value = useMemo(
    () => ({
      hideBanner,
      showBanner,
    }),
    [hideBanner, showBanner]
  );

  return (
    <BannerContext.Provider value={value}>
      {children}
      {banner ? (
        <Banner
          hideBanner={hideBanner}
          opacity={opacity}
          translateY={translateY}
          variant={banner.variant}>
          <BannerContent banner={banner} />
        </Banner>
      ) : null}
    </BannerContext.Provider>
  );
}

function BannerContent({ banner }: { banner: ShowBannerOptions }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const achievementIconColor = colorScheme === 'dark' ? '#ffb347' : '#f2994a';
  const isDarkTheme = colorScheme === 'dark';
  const streakIconColor = isDarkTheme ? '#ffb067' : '#ff8a1f';

  if (banner.variant === 'achievement' && banner.achievement) {
    return (
      <View style={styles.content}>
        {banner.achievement.icon ? (
          <View
            style={[
              styles.achievementIconCircle,
              colorScheme === 'dark'
                ? styles.achievementIconCircleDark
                : styles.achievementIconCircleLight,
            ]}>
            <Ionicons color={achievementIconColor} name={banner.achievement.icon} size={28} />
          </View>
        ) : null}
        {banner.achievement.badge ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={banner.achievement.badge}
            style={styles.achievementBadge}
          />
        ) : null}
        <View style={styles.textContent}>
          <ThemedText type="bodyStrong" style={styles.achievementTitle}>
            {banner.title}
          </ThemedText>
          {banner.description ? (
            <ThemedText style={styles.achievementDescription}>
              {banner.description}
            </ThemedText>
          ) : null}
          <ThemedText style={styles.achievementStatus}>
            {t('profile.unlocked')}
          </ThemedText>
          <View style={styles.achievementRewardRow}>
            <Image
              accessibilityIgnoresInvertColors
              contentFit="contain"
              source={require('../../assets/images/money.png')}
              style={styles.achievementMoneyIcon}
            />
            <ThemedText style={styles.achievementRewardText}>
              {t('profile.reward', { count: banner.achievement.coinsReward })}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  const shouldShowRewardIcon = banner.variant === 'reward';
  const shouldShowStreakIcon = banner.variant === 'streak';

  return (
    <View style={styles.content}>
      {shouldShowRewardIcon ? (
        <Image
          accessibilityIgnoresInvertColors
          source={require('../../assets/images/money.png')}
          style={styles.rewardIcon}
        />
      ) : null}
      {shouldShowStreakIcon ? (
        <Ionicons color={streakIconColor} name="flame" size={26} style={styles.streakIcon} />
      ) : null}
      <View style={styles.textContent}>
        <ThemedText
          type="bodyStrong"
          style={[styles.title, shouldShowStreakIcon && !isDarkTheme ? styles.streakTextLight : null]}>
          {banner.title}
        </ThemedText>
        {banner.description ? (
          <ThemedText
            style={[
              styles.description,
              shouldShowStreakIcon && !isDarkTheme ? styles.streakTextLight : null,
            ]}>
            {banner.description}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
