import { type PressableProps } from 'react-native';

import { Cta } from '@/components/cta';

type FloatingActionButtonVariant = 'primary' | 'secondary';

type FloatingActionButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: string;
  variant?: FloatingActionButtonVariant;
  withBackground?: boolean;
  bottomOffset?: number;
};

export function FloatingActionButton({
  children,
  disabled,
  variant = 'primary',
  withBackground = false,
  bottomOffset,
  ...props
}: FloatingActionButtonProps) {
  return (
    <Cta
      bottomOffset={bottomOffset}
      withBackground={withBackground}
      primaryAction={{
        ...props,
        disabled,
        label: children,
        variant,
      }}
    />
  );
}
