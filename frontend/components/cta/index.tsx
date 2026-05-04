import {
  type PressableProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useThemeColor } from '@/hooks/use-theme-color';

import { styles } from './styles';

type CtaAction = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary';
};

type CtaProps = {
  layout?: 'horizontal' | 'vertical';
  withBackground?: boolean;
  bottomOffset?: number;
  primaryAction?: CtaAction;
  secondaryAction?: CtaAction;
};

function renderAction(
  action: CtaAction,
  fallbackVariant: 'primary' | 'secondary',
  fullWidth: boolean,
) {
  const { label, textStyle, ...buttonProps } = action;

  return (
    <Button
      {...buttonProps}
      style={[styles.button, fullWidth ? styles.buttonFullWidth : null, buttonProps.style]}
      textStyle={[styles.label, textStyle]}
      variant={buttonProps.variant ?? fallbackVariant}>
      {label}
    </Button>
  );
}

export function Cta({
  layout = 'horizontal',
  primaryAction,
  secondaryAction,
  withBackground = false,
  bottomOffset,
}: CtaProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor(
    { dark: '#151718', light: '#ffffff' },
    'background',
  );
  const borderTopColor = useThemeColor({ dark: '#2b2d2f', light: '#e6e8eb' }, 'icon');

  if (!primaryAction && !secondaryAction) {
    return null;
  }

  const fullWidth = layout === 'horizontal';
  const resolvedBottomOffset =
    bottomOffset ?? (withBackground ? 0 : insets.bottom + 16);
  const backgroundBottomPadding = withBackground
    ? Math.max(insets.bottom, 6)
    : undefined;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        withBackground ? styles.wrapperFullWidth : null,
        { bottom: resolvedBottomOffset },
      ]}>
      <View
        style={[
          styles.actions,
          withBackground
            ? [
                styles.actionsWithBackground,
                {
                  backgroundColor,
                  borderTopColor,
                  paddingBottom: backgroundBottomPadding,
                },
              ]
            : null,
          layout === 'vertical' ? styles.vertical : styles.horizontal,
        ]}>
        {secondaryAction
          ? renderAction(secondaryAction, 'secondary', fullWidth)
          : null}
        {primaryAction ? renderAction(primaryAction, 'primary', fullWidth) : null}
      </View>
    </View>
  );
}
