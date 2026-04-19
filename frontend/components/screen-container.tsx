import { type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/spacing';
import { useThemeColor } from '@/hooks/use-theme-color';

type SafeAreaViewProps = ComponentProps<typeof SafeAreaView>;

type ScreenContainerProps = SafeAreaViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ScreenContainer({
  style,
  lightColor,
  darkColor,
  edges = ['top', 'bottom'],
  ...props
}: ScreenContainerProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Spacing.xxLg,
    paddingHorizontal: Spacing.xLg,
  },
});
