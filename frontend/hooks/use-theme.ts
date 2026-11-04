import { themeColors } from '@/constants/theme';
import { usePreferences } from '@/providers/preferencesProvider';

export function useTheme() {
  const { colorScheme: theme } = usePreferences();
  return { theme, colors: themeColors[theme], isDark: theme === 'dark' };
}
