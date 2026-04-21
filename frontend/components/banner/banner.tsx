import { Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themedText';
import { Spacing } from '@/constants/spacing';

import { type ShowBannerOptions } from './types';
import { styles } from './styles';

type BannerProps = {
  banner: ShowBannerOptions;
  hideBanner: () => void;
  opacity: Animated.Value;
  translateY: Animated.Value;
};

export function Banner({ banner, hideBanner, opacity, translateY }: BannerProps) {
  const insets = useSafeAreaInsets();
  const variantStyles =
    banner.variant === 'success'
      ? {
          banner: styles.success,
          description: styles.successDescription,
          title: styles.successTitle,
        }
      : {
          banner: styles.error,
          description: styles.errorDescription,
          title: styles.errorTitle,
        };

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
        style={[styles.banner, variantStyles.banner]}>
        <ThemedText type="bodyStrong" style={[styles.title, variantStyles.title]}>
          {banner.title}
        </ThemedText>
        {banner.description ? (
          <ThemedText style={[styles.description, variantStyles.description]}>
            {banner.description}
          </ThemedText>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
