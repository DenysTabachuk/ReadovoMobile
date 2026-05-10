import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themedText';

import { styles } from './styles';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  leftAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
};

export function Button({
  children,
  disabled,
  leftAccessory,
  style,
  textStyle,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const variantButtonStyle = variant === 'primary' ? styles.primary : styles.secondary;
  const variantTextStyle = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variantButtonStyle,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      {...props}>
      <View style={styles.content}>
        {leftAccessory ? (
          <View style={styles.leftAccessory}>{leftAccessory}</View>
        ) : null}

        <ThemedText
          type="buttonLabel"
          style={[styles.text, variantTextStyle, textStyle]}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}
