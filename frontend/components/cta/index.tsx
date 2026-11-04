import { useMemo } from 'react';
import {
  type PressableProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { useTheme } from '@/hooks/use-theme';

import { createStyles } from './styles';

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

export function Cta({
  layout = 'horizontal',
  primaryAction,
  secondaryAction,
  withBackground = false,
  bottomOffset,
}: CtaProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  function renderAction(
    action: CtaAction,
    fallbackVariant: 'primary' | 'secondary',
    fullWidth: boolean,
  ) {
    const { label, textStyle, ...buttonProps } = action;

    return (
      <Button
        {...buttonProps}
        style={[
          styles.button,
          fullWidth ? styles.buttonFullWidth : null,
          buttonProps.style,
        ]}
        textStyle={[styles.label, textStyle]}
        variant={buttonProps.variant ?? fallbackVariant}
      >
        {label}
      </Button>
    );
  }

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
      ]}
    >
      <View
        style={[
          styles.actions,
          withBackground
            ? [
                styles.actionsWithBackground,
                {
                  paddingBottom: backgroundBottomPadding,
                },
              ]
            : null,
          layout === 'vertical' ? styles.vertical : styles.horizontal,
        ]}
      >
        {secondaryAction
          ? renderAction(secondaryAction, 'secondary', fullWidth)
          : null}
        {primaryAction
          ? renderAction(primaryAction, 'primary', fullWidth)
          : null}
      </View>
    </View>
  );
}
