import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ThemeOverrides = { light?: string; dark?: string };

// Temporary adapter for legacy callers, including their per-theme overrides.
export function useThemeColor(
  props: ThemeOverrides,
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const { theme } = useTheme();
  return props[theme] || Colors[theme][colorName];
}
