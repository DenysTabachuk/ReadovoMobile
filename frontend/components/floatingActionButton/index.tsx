import { type ReactNode } from 'react';
import { type PressableProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';

import { styles } from './styles';

type FloatingActionButtonVariant = 'primary' | 'secondary';

type FloatingActionButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  variant?: FloatingActionButtonVariant;
};

export function FloatingActionButton({
  children,
  disabled,
  variant = 'primary',
  ...props
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 16 }]}>
      <Button
        disabled={disabled}
        style={styles.button}
        textStyle={styles.label}
        variant={variant}
        {...props}>
        {children}
      </Button>
    </View>
  );
}
