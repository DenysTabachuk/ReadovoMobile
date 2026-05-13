import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { Animated, Pressable, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/spacing';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { styles } from './styles';

type ScrollableRef =
  | {
      scrollTo: (options?: { animated?: boolean; x?: number; y?: number }) => void;
    }
  | {
      scrollToOffset: (params: { animated?: boolean; offset: number }) => void;
    };

type ScrollToTopButtonProps = {
  scrollRef: RefObject<ScrollableRef | null>;
  scrollOffsetY: number;
  threshold?: number;
  bottomOffset?: number;
  rightOffset?: number;
  size?: number;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

export function ScrollToTopButton({
  scrollRef,
  scrollOffsetY,
  threshold = 300,
  bottomOffset = Spacing.xLg,
  rightOffset = Spacing.xLg,
  size = 52,
  icon,
  accessibilityLabel = 'Scroll to top',
}: ScrollToTopButtonProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const buttonColor = colorScheme === 'dark' ? '#7d4ef6' : '#6f3ff0';
  const animation = useRef(new Animated.Value(0)).current;
  const isVisible = scrollOffsetY > threshold;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [animation, isVisible]);

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      bottom: insets.bottom + bottomOffset,
      right: rightOffset,
    }),
    [bottomOffset, insets.bottom, rightOffset],
  );

  const handlePress = () => {
    if (!scrollRef.current) {
      return;
    }

    if ('scrollToOffset' in scrollRef.current) {
      scrollRef.current.scrollToOffset({
        animated: true,
        offset: 0,
      });

      return;
    }

    scrollRef.current.scrollTo({
      animated: true,
      y: 0,
    });
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        styles.wrapperDefault,
        containerStyle,
        {
          opacity: animation,
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.82, 1],
              }),
            },
          ],
        },
      ]}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isVisible }}
        disabled={!isVisible}
        hitSlop={8}
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: buttonColor,
            height: size,
            width: size,
          },
        ]}>
        {icon ?? <Ionicons color="#ffffff" name="arrow-up" size={24} />}
      </Pressable>
    </Animated.View>
  );
}
