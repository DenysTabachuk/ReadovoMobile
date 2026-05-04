import { type PressableProps } from 'react-native';

import { Cta } from '@/components/cta';

type FloatingActionButtonVariant = 'primary' | 'secondary';

type FloatingActionButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  children: string;
  variant?: FloatingActionButtonVariant;
};

export function FloatingActionButton({
  children,
  disabled,
  variant = 'primary',
  ...props
}: FloatingActionButtonProps) {
  return (
    <Cta
      primaryAction={{
        ...props,
        disabled,
        label: children,
        variant,
      }}
    />
  );
}
