import { useTheme } from '@/hooks/use-theme';
import { type ReactNode, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/spacing';

import { type ShowBannerOptions } from './types';
import { createStyles } from './styles';
import { achievementGradients } from '@/constants/gradients';

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
  const { colors, theme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const variantStyle = resolveVariantStyle(variant, styles);

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
      ]}
    >
      <Pressable
        accessibilityRole="alert"
        onPress={hideBanner}
        style={[styles.banner, variantStyle]}
      >
        {variant === 'achievement' ? (
          <LinearGradient
            colors={achievementGradients[theme]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={styles.achievementGradient}
          />
        ) : null}
        {children}
      </Pressable>
    </Animated.View>
  );
}

function resolveVariantStyle(
  variant: ShowBannerOptions['variant'],
  styles: ReturnType<typeof createStyles>,
) {
  if (variant === 'success') {
    return styles.success;
  }

  if (variant === 'reward') {
    return styles.reward;
  }

  if (variant === 'info') {
    return styles.info;
  }

  if (variant === 'achievement') {
    return styles.achievement;
  }

  if (variant === 'streak') {
    return styles.streak;
  }

  return styles.error;
}
