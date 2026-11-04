import { useMemo, type ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createStyles } from './styles';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = ComponentProps<typeof SafeAreaView>;

export function ScreenContainer({
  style,
  edges = ['top', 'bottom'],
  ...props
}: ScreenContainerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]} {...props} />
  );
}
