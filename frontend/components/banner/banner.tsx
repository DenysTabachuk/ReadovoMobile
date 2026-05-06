import { type ReactNode } from 'react';
import { Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/spacing';

import { type ShowBannerOptions } from './types';
import { styles } from './styles';

type BannerProps = {
  children: ReactNode;
  hideBanner: () => void;
  opacity: Animated.Value;
  translateY: Animated.Value;
  variant: ShowBannerOptions['variant'];
};

export function Banner({
  children,
  hideBanner,
  opacity,
  translateY,
  variant,
}: BannerProps) {
  const insets = useSafeAreaInsets();
  const variantStyle = resolveVariantStyle(variant);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          opacity,
          top: insets.top + Spacing.sm,
          transform: [{ translateY }],
        },
      ]}>
      <Pressable
        accessibilityRole="alert"
        onPress={hideBanner}
        style={[styles.banner, variantStyle]}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function resolveVariantStyle(variant: ShowBannerOptions['variant']) {
  if (variant === 'success') {
    return styles.success;
  }

  if (variant === 'reward') {
    return styles.reward;
  }

  return styles.error;
}
