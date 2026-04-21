import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

import { Banner } from './banner';
import {
  ANIMATION_DURATION_MS,
  DEFAULT_DURATION_MS,
  HIDDEN_OFFSET,
} from './constants';
import { BannerContext } from './context';
import { type ShowBannerOptions } from './types';

type BannerProviderProps = {
  children: ReactNode;
};

export function BannerProvider({ children }: BannerProviderProps) {
  const [banner, setBanner] = useState<ShowBannerOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideBanner = useCallback(() => {
    clearHideTimer();

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
      if (finished) {
        setBanner(null);
      }
    });
  }, [clearHideTimer, opacity, translateY]);

  const showBanner = useCallback(
    ({ durationMs = DEFAULT_DURATION_MS, ...options }: ShowBannerOptions) => {
      clearHideTimer();
      opacity.stopAnimation();
      translateY.stopAnimation();

      setBanner({
        ...options,
        durationMs,
      });

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

      if (durationMs > 0) {
        timerRef.current = setTimeout(hideBanner, durationMs);
      }
    },
    [clearHideTimer, hideBanner, opacity, translateY]
  );

  useEffect(() => clearHideTimer, [clearHideTimer]);

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
          banner={banner}
          hideBanner={hideBanner}
          opacity={opacity}
          translateY={translateY}
        />
      ) : null}
    </BannerContext.Provider>
  );
}
