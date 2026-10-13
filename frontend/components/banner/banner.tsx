import { type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === 'dark';
  const variantStyle = resolveVariantStyle(variant, isDarkTheme);

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
        {variant === 'achievement' ? (
          <LinearGradient
            colors={
              isDarkTheme
                ? ['#211339', '#3a2461', '#5b36ad']
                : ['#f3edff', '#e4d7ff', '#c9b2ff']
            }
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

function resolveVariantStyle(variant: ShowBannerOptions['variant'], isDarkTheme: boolean) {
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
    return isDarkTheme ? styles.streakDark : styles.streakLight;
  }

  return styles.error;
}
