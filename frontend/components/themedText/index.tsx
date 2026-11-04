import { useMemo } from 'react';
import { Text, type TextProps } from 'react-native';

import type { TypographyType } from '@/constants/typography';
import { createStyles } from './styles';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: TypographyType;
};

export function ThemedText({
  style,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <Text style={[styles.baseText, styles[type], style]} {...rest} />;
}
